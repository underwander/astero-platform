import assert from "node:assert/strict";
import test from "node:test";
import { validateTradeOrder } from "../src/lib/trade-order.ts";
import { calculateAccountRisk, calculateRequiredMargin } from "../src/lib/trading-risk.ts";

const validOrder = {
  clientOrderId: "order_12345678",
  symbol: "EUR/USD",
  side: "BUY",
  volume: 0.01,
  stopLoss: null,
  takeProfit: null,
};

test("validates a minimum-size BUY order", () => {
  const result = validateTradeOrder(validOrder);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.order.side, "BUY");
});

test("validates a SELL order", () => {
  const result = validateTradeOrder({ ...validOrder, side: "SELL" });
  assert.equal(result.ok, true);
});

test("accepts users regardless of account age or trade history when order parameters are valid", () => {
  const newUserOrder = validateTradeOrder(validOrder);
  const oldUserOrder = validateTradeOrder({ ...validOrder, clientOrderId: "old_user_order" });
  assert.equal(newUserOrder.ok, true);
  assert.equal(oldUserOrder.ok, true);
});

test("rejects an unknown symbol instead of silently using EUR/USD", () => {
  const result = validateTradeOrder({ ...validOrder, symbol: "BTC/USDT" });
  assert.equal(result.ok, false);
});

test("rejects invalid directions", () => {
  const result = validateTradeOrder({ ...validOrder, side: "LONG" });
  assert.equal(result.ok, false);
});

test("rejects volume below minimum", () => {
  const result = validateTradeOrder({ ...validOrder, volume: 0.001 });
  assert.equal(result.ok, false);
});

test("rejects volume above maximum", () => {
  const result = validateTradeOrder({ ...validOrder, volume: 101 });
  assert.equal(result.ok, false);
});

test("rejects volume that does not match lot step", () => {
  const result = validateTradeOrder({ ...validOrder, volume: 0.015 });
  assert.equal(result.ok, false);
});

test("rejects malformed SL and TP", () => {
  assert.equal(validateTradeOrder({ ...validOrder, stopLoss: "not-a-number" }).ok, false);
  assert.equal(validateTradeOrder({ ...validOrder, takeProfit: -1 }).ok, false);
});

test("requires a stable client order id for idempotency", () => {
  assert.equal(validateTradeOrder({ ...validOrder, clientOrderId: "" }).ok, false);
  assert.equal(validateTradeOrder({ ...validOrder, clientOrderId: "bad id with spaces" }).ok, false);
});

test("calculates required margin consistently", () => {
  const quoteMap = {
    "EUR/USD": {
      price: 1.1,
      bid: 1.1,
      ask: 1.1002,
      settings: { leverage: 100, margin: 1, contractSize: 100000 },
    },
  };
  const margin = calculateRequiredMargin(
    { symbol: "EUR/USD", side: "BUY", openPrice: 1.1002, volume: 0.01 },
    quoteMap
  );
  assert.equal(margin, 11);
});

test("includes existing positions when calculating free margin", () => {
  const risk = calculateAccountRisk(
    100,
    [{ symbol: "EUR/USD", side: "BUY", openPrice: 1.1, volume: 0.05 }],
    { "EUR/USD": { price: 1.1, bid: 1.1, ask: 1.1002 } }
  );
  assert.ok(risk.usedMargin > 0);
  assert.ok(risk.freeMargin < risk.equity);
});
