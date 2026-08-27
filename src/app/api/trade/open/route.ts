import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureManualQuotesTable } from "@/lib/manual-quotes";
import { calculateAccountRisk, calculateRequiredMargin, type RiskQuote, type RiskQuoteMap } from "@/lib/trading-risk";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";
import { tradeError, validateTradeOrder } from "@/lib/trade-order";
import { GET as getQuote } from "@/app/api/quotes/route";

type ExecutionQuote = {
  price: number;
  bid: number;
  ask: number;
  time?: string;
  source?: string;
  settings?: RiskQuote["settings"];
};

async function resolveQuote(req: Request, symbol: string) {
  const url = new URL("/api/quotes", req.url);
  url.searchParams.set("symbol", symbol);
  const response = await getQuote(new Request(url, { headers: req.headers }));
  const payload = await response.json();

  if (!response.ok) {
    return { ok: false as const, status: response.status, payload };
  }

  const price = Number(payload.price);
  const bid = Number(payload.bid ?? price);
  const ask = Number(payload.ask ?? price);
  if (![price, bid, ask].every((value) => Number.isFinite(value) && value > 0)) {
    return { ok: false as const, status: 503, payload: { error: "Price unavailable" } };
  }

  const source = typeof payload.source === "string" ? payload.source : "unknown";
  const quoteTime = typeof payload.time === "string" ? Date.parse(payload.time) : Number.NaN;
  if (source === "live" && (!Number.isFinite(quoteTime) || Date.now() - quoteTime > 5 * 60 * 1000)) {
    return { ok: false as const, status: 503, payload: { error: "Stale market price" } };
  }

  return {
    ok: true as const,
    quote: { price, bid, ask, time: payload.time, source, settings: payload.settings ?? null } as ExecutionQuote,
  };
}

export async function POST(req: Request) {
  const correlationId = req.headers.get("x-request-id") || randomUUID();

  try {
    await Promise.all([ensureCrmSchema(), ensureManualQuotesTable()]);
    const body = (await req.json()) as Record<string, unknown>;
    const scoped = await resolveScopedUserId(
      typeof body.userId === "string" ? body.userId : null,
      { allowStaffAccess: true }
    );
    if (isAuthResponse(scoped)) {
      return scoped.status === 401
        ? tradeError("AUTH_REQUIRED", "Сессия завершена. Войдите снова.", 401, correlationId)
        : tradeError("ACCOUNT_RESTRICTED", "Недостаточно прав для этого торгового счета", 403, correlationId);
    }

    const validation = validateTradeOrder(body);
    if (!validation.ok) {
      return tradeError(validation.code, validation.message, 400, correlationId);
    }
    const order = validation.order;

    const replay = await prisma.trade.findFirst({
      where: { userId: scoped.userId, clientOrderId: order.clientOrderId },
    });
    if (replay) {
      return Response.json({ ...replay, idempotent: true, correlationId });
    }

    const currentQuoteResult = await resolveQuote(req, order.symbol);
    if (!currentQuoteResult.ok) {
      const code = currentQuoteResult.status === 403 ? "TRADING_DISABLED" : "MARKET_UNAVAILABLE";
      const message = code === "TRADING_DISABLED"
        ? "Торговля по этому инструменту сейчас недоступна"
        : "Не удалось получить актуальную рыночную цену. Попробуйте снова.";
      return tradeError(code, message, currentQuoteResult.status === 403 ? 403 : 503, correlationId);
    }

    const existingPositions = await prisma.trade.findMany({
      where: { userId: scoped.userId, closePrice: null },
      select: { symbol: true },
    });
    const otherSymbols = Array.from(
      new Set(existingPositions.map((trade) => trade.symbol).filter((symbol) => symbol !== order.symbol))
    );
    const otherQuoteEntries = await Promise.all(
      otherSymbols.map(async (symbol) => [symbol, await resolveQuote(req, symbol)] as const)
    );

    const manualQuote = await prisma.manualQuote.findUnique({ where: { symbol: order.symbol } });
    if (manualQuote?.tradingHours && !isTradingAllowed(manualQuote.tradingHours)) {
      return tradeError("MARKET_UNAVAILABLE", "Торговая сессия по этому инструменту закрыта", 403, correlationId);
    }

    const executionPrice = order.side === "BUY"
      ? currentQuoteResult.quote.ask
      : currentQuoteResult.quote.bid;
    const resolvedQuotes: RiskQuoteMap = {
      [order.symbol]: currentQuoteResult.quote,
    };
    for (const [symbol, result] of otherQuoteEntries) {
      if (result.ok) resolvedQuotes[symbol] = result.quote;
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedUsers = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "User" WHERE "id" = ${scoped.userId} FOR UPDATE
      `;
      if (lockedUsers.length === 0) throw new Error("USER_NOT_FOUND");

      const existing = await tx.trade.findFirst({
        where: { userId: scoped.userId, clientOrderId: order.clientOrderId },
      });
      if (existing) return { trade: existing, idempotent: true };

      const user = await tx.user.findUnique({
        where: { id: scoped.userId },
        include: { trades: { where: { closePrice: null } } },
      });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.isBlocked) throw new Error("ACCOUNT_RESTRICTED");
      if (!user.tradingEnabled) throw new Error("TRADING_DISABLED");

      const accountRisk = calculateAccountRisk(user.balance, user.trades, resolvedQuotes);
      const orderMargin = calculateRequiredMargin(
        { symbol: order.symbol, side: order.side, openPrice: executionPrice, volume: order.volume },
        resolvedQuotes
      );
      if (!Number.isFinite(orderMargin) || orderMargin <= 0) throw new Error("INVALID_MARGIN");
      if (accountRisk.equity <= 0 || accountRisk.freeMargin < orderMargin) {
        const error = new Error("INSUFFICIENT_MARGIN") as Error & { details?: Record<string, number> };
        error.details = { freeMargin: accountRisk.freeMargin, requiredMargin: orderMargin };
        throw error;
      }

      const trade = await tx.trade.create({
        data: {
          clientOrderId: order.clientOrderId,
          userId: scoped.userId,
          symbol: order.symbol,
          side: order.side,
          openPrice: executionPrice,
          volume: order.volume,
          swap:
            order.side === "BUY"
              ? Number(manualQuote?.swapLong || 0) - Number(manualQuote?.commission || 0)
              : Number(manualQuote?.swapShort || 0) - Number(manualQuote?.commission || 0),
          stopLoss: order.stopLoss,
          takeProfit: order.takeProfit,
        },
      });
      return { trade, idempotent: false };
    });

    console.info("Trade open result", {
      correlationId,
      clientOrderId: order.clientOrderId,
      userId: scoped.userId,
      symbol: order.symbol,
      side: order.side,
      result: result.idempotent ? "IDEMPOTENT_REPLAY" : "CREATED",
    });
    return Response.json({ ...result.trade, idempotent: result.idempotent, correlationId });
  } catch (error) {
    const category = error instanceof Error ? error.message : "INTERNAL_ERROR";
    console.error("Trade open failed", { correlationId, category });

    if (category === "INSUFFICIENT_MARGIN") {
      const details = (error as Error & { details?: Record<string, number> }).details;
      return Response.json(
        {
          error: "Недостаточно свободных средств для открытия сделки",
          code: "INSUFFICIENT_MARGIN",
          correlationId,
          ...details,
        },
        { status: 400 }
      );
    }
    if (category === "TRADING_DISABLED") {
      return tradeError("TRADING_DISABLED", "Торговля по этому счету запрещена. Обратитесь к менеджеру.", 403, correlationId);
    }
    if (category === "ACCOUNT_RESTRICTED" || category === "USER_NOT_FOUND") {
      return tradeError("ACCOUNT_RESTRICTED", "Торговый счет недоступен", 403, correlationId);
    }
    if (category === "INVALID_MARGIN") {
      return tradeError("INVALID_TRADE_PARAMETERS", "Не удалось рассчитать маржу для сделки", 400, correlationId);
    }
    return tradeError("INTERNAL_ERROR", "Не удалось открыть сделку. Попробуйте снова.", 500, correlationId);
  }
}

function isTradingAllowed(tradingHours: string) {
  const value = tradingHours.trim().toLowerCase();
  if (!value || value === "24/7") return true;
  if (value === "closed" || value === "disabled") return false;
  if (value === "24/5") {
    const day = new Date().getUTCDay();
    return day !== 0 && day !== 6;
  }
  return true;
}
