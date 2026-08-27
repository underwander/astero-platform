import { marketInstruments, type MarketInstrument } from "./market-instruments.ts";

export type TradeErrorCode =
  | "INVALID_TRADE_PARAMETERS"
  | "INSUFFICIENT_MARGIN"
  | "MARKET_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "TRADING_DISABLED"
  | "ACCOUNT_RESTRICTED"
  | "AUTH_REQUIRED"
  | "INTERNAL_ERROR";

export type ValidatedTradeOrder = {
  clientOrderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  volume: number;
  stopLoss: number | null;
  takeProfit: number | null;
  instrument: MarketInstrument;
};

export type TradeOrderValidation =
  | { ok: true; order: ValidatedTradeOrder }
  | { ok: false; code: "INVALID_TRADE_PARAMETERS"; message: string };

function optionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function matchesLotStep(volume: number, instrument: MarketInstrument) {
  const steps = (volume - instrument.minLot) / instrument.lotStep;
  return Math.abs(steps - Math.round(steps)) < 1e-8;
}

export function validateTradeOrder(input: Record<string, unknown>): TradeOrderValidation {
  const clientOrderId = typeof input.clientOrderId === "string" ? input.clientOrderId.trim() : "";
  const symbol = typeof input.symbol === "string" ? input.symbol.trim() : "";
  const side = input.side;
  const volume = Number(input.volume);
  const stopLoss = optionalPositiveNumber(input.stopLoss);
  const takeProfit = optionalPositiveNumber(input.takeProfit);
  const instrument = marketInstruments.find((item) => item.symbol === symbol);

  if (!clientOrderId || clientOrderId.length > 100 || !/^[A-Za-z0-9_-]+$/.test(clientOrderId)) {
    return { ok: false, code: "INVALID_TRADE_PARAMETERS", message: "Некорректный идентификатор заявки" };
  }
  if (!instrument) {
    return { ok: false, code: "INVALID_TRADE_PARAMETERS", message: "Торговый инструмент не поддерживается" };
  }
  if (side !== "BUY" && side !== "SELL") {
    return { ok: false, code: "INVALID_TRADE_PARAMETERS", message: "Выберите направление BUY или SELL" };
  }
  if (
    !Number.isFinite(volume) ||
    volume < instrument.minLot ||
    volume > instrument.maxLot ||
    !matchesLotStep(volume, instrument)
  ) {
    return {
      ok: false,
      code: "INVALID_TRADE_PARAMETERS",
      message: `Объем должен быть от ${instrument.minLot} до ${instrument.maxLot} с шагом ${instrument.lotStep}`,
    };
  }
  if (Number.isNaN(stopLoss) || Number.isNaN(takeProfit)) {
    return { ok: false, code: "INVALID_TRADE_PARAMETERS", message: "Stop Loss и Take Profit должны быть положительными числами" };
  }

  return {
    ok: true,
    order: { clientOrderId, symbol, side, volume, stopLoss, takeProfit, instrument },
  };
}

export function tradeError(code: TradeErrorCode, message: string, status: number, correlationId: string) {
  return Response.json({ error: message, code, correlationId }, { status });
}
