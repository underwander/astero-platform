import { calculateTradeProfit, getInstrument } from "./market-instruments.ts";

export const STOP_OUT_LEVEL_PERCENT = 20;

export type RiskTrade = {
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  swap?: number | null;
};

export type RiskQuote = {
  price?: number;
  bid?: number;
  ask?: number;
  settings?: {
    leverage?: number | null;
    margin?: number | null;
    contractSize?: number | null;
    spreadAsk?: number | null;
    tickValue?: number | null;
  } | null;
};

export type RiskQuoteMap = Record<string, RiskQuote | undefined>;

export function getClosePriceForTrade(trade: RiskTrade, quotes: RiskQuoteMap = {}) {
  const instrument = getInstrument(trade.symbol);
  const quote = quotes[trade.symbol];
  const mid = Number(quote?.price || trade.openPrice);
  const bid = Number(quote?.bid || mid);
  const ask = Number(
    quote?.ask || bid + instrument.pointSize * Number(quote?.settings?.spreadAsk ?? 14)
  );

  return trade.side === "BUY" ? bid : ask;
}

export function calculateRequiredMargin(trade: RiskTrade, quotes: RiskQuoteMap = {}) {
  const instrument = getInstrument(trade.symbol);
  const quote = quotes[trade.symbol];
  const price = Number(quote?.price || quote?.bid || quote?.ask || trade.openPrice);
  const leverage = Math.max(1, Number(quote?.settings?.leverage || 100));
  const marginRate = Math.max(0, Number(quote?.settings?.margin ?? 1));
  const contractSize = Math.max(1, Number(quote?.settings?.contractSize || instrument.contractSize));

  return (contractSize * Number(trade.volume || 0) * price * marginRate) / leverage;
}

export function calculateAccountRisk(balance: number, trades: RiskTrade[], quotes: RiskQuoteMap = {}) {
  const floatingProfit = trades.reduce((sum, trade) => {
    const closePrice = getClosePriceForTrade(trade, quotes);
    return sum + calculateTradeProfit(
      trade.symbol,
      trade.side,
      trade.openPrice,
      closePrice,
      trade.volume,
      trade.swap ?? 0,
      quotes[trade.symbol]?.settings?.tickValue
    );
  }, 0);

  const usedMargin = trades.reduce((sum, trade) => sum + calculateRequiredMargin(trade, quotes), 0);
  const equity = Math.max(0, Number(balance || 0) + floatingProfit);
  const freeMargin = Math.max(0, equity - usedMargin);
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : null;

  return {
    balance: Number(balance || 0),
    equity,
    floatingProfit,
    usedMargin,
    freeMargin,
    marginLevel,
    stopOutLevel: STOP_OUT_LEVEL_PERCENT,
    stopOut:
      trades.length > 0 &&
      (equity <= 0 || (marginLevel !== null && marginLevel <= STOP_OUT_LEVEL_PERCENT)),
  };
}
