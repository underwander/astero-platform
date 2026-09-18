import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { selectRandomQuotes, wisdomQuotes } from "../src/data/wisdomQuotes.ts";

test("wisdom collection contains at least 200 unique sourced quotes", () => {
  assert.ok(wisdomQuotes.length >= 200);
  assert.equal(new Set(wisdomQuotes.map((quote) => quote.text)).size, wisdomQuotes.length);
  assert.ok(wisdomQuotes.every((quote) => quote.author && quote.source && quote.text.length <= 180));
});

test("ticker selection does not repeat a quote", () => {
  let seed = 17;
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const selected = selectRandomQuotes(wisdomQuotes, 24, random);
  assert.equal(selected.length, 24);
  assert.equal(new Set(selected.map((quote) => quote.id)).size, selected.length);
});

test("ticker is seamless, pauses on hover and respects reduced motion", () => {
  const component = readFileSync("src/components/admin/WisdomTicker.tsx", "utf8");
  const styles = readFileSync("src/components/admin/WisdomTicker.module.css", "utf8");
  assert.match(component, /<QuoteGroup quotes=\{quotes\} \/>/);
  assert.match(component, /<QuoteGroup quotes=\{quotes\} duplicate \/>/);
  assert.match(styles, /translate3d\(-50%/);
  assert.match(styles, /\.root:hover \.track/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("ticker is rendered once immediately after today's metrics", () => {
  const overview = readFileSync("src/components/admin/ManagerOverview.tsx", "utf8");
  const crm = readFileSync("src/components/admin/AsteroCrm.tsx", "utf8");
  const metrics = overview.indexOf('label="Задачи сегодня"');
  const ticker = overview.indexOf("<WisdomTicker />", metrics);
  const plan = overview.indexOf('xl:grid-cols-[minmax(0,1.7fr)', ticker);
  assert.ok(metrics >= 0 && ticker > metrics && plan > ticker);
  assert.doesNotMatch(crm, /<WisdomTicker \/>/);
  assert.equal((overview.match(/<WisdomTicker \/>/g) || []).length, 1);
});

test("client dashboard reuses the ticker below account metrics", () => {
  const dashboard = readFileSync("src/app/(admin)/dashboard/page.tsx", "utf8");
  const clientTicker = readFileSync("src/components/broker/ClientWisdomTicker.tsx", "utf8");
  const metrics = dashboard.indexOf("<BrokerMetrics />");
  const ticker = dashboard.indexOf("<ClientWisdomTicker />");
  const calculator = dashboard.indexOf("<ProfitCalculator />");
  assert.ok(metrics >= 0 && ticker > metrics && calculator > ticker);
  assert.match(clientTicker, /import\("@\/components\/admin\/WisdomTicker"\)/);
  assert.match(clientTicker, /<WisdomTicker \/>/);
});

test("client dashboard keeps its original direct component layout", () => {
  const dashboard = readFileSync("src/app/(admin)/dashboard/page.tsx", "utf8");
  for (const panel of ["ProfitCalculator", "TransferHistory", "AnnouncementsBoard", "MarketWatch", "TraderNews", "LegalDocumentsPanel"]) {
    assert.match(dashboard, new RegExp(`<${panel}`));
  }
  assert.doesNotMatch(dashboard, /DashboardLiquidGlass|styles\.glassPanel|styles\.shell/);
});

test("client dashboard uses the original metric card artwork", () => {
  const metrics = readFileSync("src/components/ecommerce/BrokerMetrics.tsx", "utf8");
  assert.match(metrics, /bg-gradient-to-br from-\[#0f5132\]/);
  assert.match(metrics, /<svg width="26" height="26"/);
  assert.doesNotMatch(metrics, /DashboardPanelIcon/);
});
