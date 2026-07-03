export type MarketGroup = "Forex" | "Metals" | "Crypto" | "Indices" | "Stocks" | "Energy";

export type MarketInstrument = {
  symbol: string;
  group: MarketGroup;
  tvSymbol: string;
  quoteSymbol: string;
  digits: number;
  pointSize: number;
  tickValue: number;
  contractSize: number;
  lotStep: number;
  minLot: number;
  maxLot: number;
  defaultPrice: number;
};

export const marketInstruments: MarketInstrument[] = [
  { symbol: "EUR/USD", group: "Forex", tvSymbol: "FX_IDC%3AEURUSD", quoteSymbol: "EUR/USD", digits: 5, pointSize: 0.0001, tickValue: 10, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 1.085 },
  { symbol: "GBP/USD", group: "Forex", tvSymbol: "FX_IDC%3AGBPUSD", quoteSymbol: "GBP/USD", digits: 5, pointSize: 0.0001, tickValue: 10, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 1.27 },
  { symbol: "USD/JPY", group: "Forex", tvSymbol: "FX_IDC%3AUSDJPY", quoteSymbol: "USD/JPY", digits: 3, pointSize: 0.01, tickValue: 9.5, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 157.5 },
  { symbol: "AUD/USD", group: "Forex", tvSymbol: "FX_IDC%3AAUDUSD", quoteSymbol: "AUD/USD", digits: 5, pointSize: 0.0001, tickValue: 10, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 0.665 },
  { symbol: "USD/CAD", group: "Forex", tvSymbol: "FX_IDC%3AUSDCAD", quoteSymbol: "USD/CAD", digits: 5, pointSize: 0.0001, tickValue: 7.3, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 1.37 },
  { symbol: "USD/CHF", group: "Forex", tvSymbol: "FX_IDC%3AUSDCHF", quoteSymbol: "USD/CHF", digits: 5, pointSize: 0.0001, tickValue: 11, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 0.89 },
  { symbol: "NZD/USD", group: "Forex", tvSymbol: "FX_IDC%3ANZDUSD", quoteSymbol: "NZD/USD", digits: 5, pointSize: 0.0001, tickValue: 10, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 0.61 },
  { symbol: "EUR/GBP", group: "Forex", tvSymbol: "FX_IDC%3AEURGBP", quoteSymbol: "EUR/GBP", digits: 5, pointSize: 0.0001, tickValue: 12.7, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 0.855 },
  { symbol: "EUR/JPY", group: "Forex", tvSymbol: "FX_IDC%3AEURJPY", quoteSymbol: "EUR/JPY", digits: 3, pointSize: 0.01, tickValue: 9.5, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 170.5 },
  { symbol: "GBP/JPY", group: "Forex", tvSymbol: "FX_IDC%3AGBPJPY", quoteSymbol: "GBP/JPY", digits: 3, pointSize: 0.01, tickValue: 9.5, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 199.5 },
  { symbol: "EUR/CHF", group: "Forex", tvSymbol: "FX_IDC%3AEURCHF", quoteSymbol: "EUR/CHF", digits: 5, pointSize: 0.0001, tickValue: 11, contractSize: 100000, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 0.965 },
  { symbol: "XAU/USD", group: "Metals", tvSymbol: "OANDA%3AXAUUSD", quoteSymbol: "XAU/USD", digits: 2, pointSize: 0.01, tickValue: 1, contractSize: 100, lotStep: 0.01, minLot: 0.01, maxLot: 50, defaultPrice: 2320 },
  { symbol: "XAG/USD", group: "Metals", tvSymbol: "OANDA%3AXAGUSD", quoteSymbol: "XAG/USD", digits: 3, pointSize: 0.001, tickValue: 5, contractSize: 5000, lotStep: 0.01, minLot: 0.01, maxLot: 50, defaultPrice: 29 },
  { symbol: "WTI/USD", group: "Energy", tvSymbol: "TVC%3AUSOIL", quoteSymbol: "WTI/USD", digits: 2, pointSize: 0.01, tickValue: 10, contractSize: 1000, lotStep: 0.01, minLot: 0.01, maxLot: 50, defaultPrice: 78 },
  { symbol: "BTC/USD", group: "Crypto", tvSymbol: "BITSTAMP%3ABTCUSD", quoteSymbol: "BTC/USD", digits: 2, pointSize: 1, tickValue: 1, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 20, defaultPrice: 69000 },
  { symbol: "ETH/USD", group: "Crypto", tvSymbol: "BITSTAMP%3AETHUSD", quoteSymbol: "ETH/USD", digits: 2, pointSize: 1, tickValue: 1, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 3600 },
  { symbol: "SOL/USD", group: "Crypto", tvSymbol: "BINANCE%3ASOLUSDT", quoteSymbol: "SOL/USD", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 1000, defaultPrice: 165 },
  { symbol: "US100", group: "Indices", tvSymbol: "CAPITALCOM%3AUS100", quoteSymbol: "NDX", digits: 2, pointSize: 0.1, tickValue: 1, contractSize: 10, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 19000 },
  { symbol: "SPX500", group: "Indices", tvSymbol: "CAPITALCOM%3AUS500", quoteSymbol: "SPX", digits: 2, pointSize: 0.1, tickValue: 1, contractSize: 10, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 5300 },
  { symbol: "US30", group: "Indices", tvSymbol: "CAPITALCOM%3AUS30", quoteSymbol: "DJI", digits: 2, pointSize: 1, tickValue: 1, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 39000 },
  { symbol: "DAX40", group: "Indices", tvSymbol: "CAPITALCOM%3ADE40", quoteSymbol: "DAX", digits: 2, pointSize: 0.1, tickValue: 1, contractSize: 10, lotStep: 0.01, minLot: 0.01, maxLot: 100, defaultPrice: 18500 },
  { symbol: "AAPL", group: "Stocks", tvSymbol: "NASDAQ%3AAAPL", quoteSymbol: "AAPL", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 10000, defaultPrice: 190 },
  { symbol: "TSLA", group: "Stocks", tvSymbol: "NASDAQ%3ATSLA", quoteSymbol: "TSLA", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 10000, defaultPrice: 175 },
  { symbol: "NVDA", group: "Stocks", tvSymbol: "NASDAQ%3ANVDA", quoteSymbol: "NVDA", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 10000, defaultPrice: 120 },
  { symbol: "MSFT", group: "Stocks", tvSymbol: "NASDAQ%3AMSFT", quoteSymbol: "MSFT", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 10000, defaultPrice: 430 },
  { symbol: "AMZN", group: "Stocks", tvSymbol: "NASDAQ%3AAMZN", quoteSymbol: "AMZN", digits: 2, pointSize: 0.01, tickValue: 0.01, contractSize: 1, lotStep: 0.01, minLot: 0.01, maxLot: 10000, defaultPrice: 180 },
];

export const marketGroups: Array<MarketGroup | "All"> = ["All", "Forex", "Metals", "Energy", "Crypto", "Indices", "Stocks"];

export function getInstrument(symbol: string) {
  return marketInstruments.find((item) => item.symbol === symbol) || marketInstruments[0];
}

export function formatPrice(symbol: string, price: number) {
  return Number(price).toLocaleString(undefined, {
    minimumFractionDigits: getInstrument(symbol).digits,
    maximumFractionDigits: getInstrument(symbol).digits,
  });
}

export function calculateTradeProfit(symbol: string, side: string, openPrice: number, closePrice: number, volume: number, swap = 0, customTickValue?: number | null) {
  const instrument = getInstrument(symbol);
  const direction = side === "BUY" ? 1 : -1;
  const points = ((closePrice - openPrice) * direction) / instrument.pointSize;
  const tickValue = Number.isFinite(Number(customTickValue)) && Number(customTickValue) > 0
    ? Number(customTickValue)
    : instrument.tickValue;
  return points * tickValue * volume + Number(swap || 0);
}
