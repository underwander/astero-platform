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
