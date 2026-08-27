import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_FAILURE_WINDOW_MS,
  calculateLoginRateLimit,
} from "../src/lib/login-rate-limit.ts";

const nowMs = Date.UTC(2026, 7, 27, 12, 0, 0);
const secondsAgo = (seconds: number) => new Date(nowMs - seconds * 1000);
const failures = (count: number, latestSecondsAgo = 1) =>
  Array.from({ length: count }, (_, index) => secondsAgo(latestSecondsAgo + count - index - 1));

test("24 consecutive password failures do not lock the account", () => {
  const result = calculateLoginRateLimit({
    nowMs,
    accountFailureTimes: failures(24),
    ipFailureTimes: [],
  });
  assert.equal(result.limited, false);
});

test("the 25th password failure locks the account", () => {
  const result = calculateLoginRateLimit({
    nowMs,
    accountFailureTimes: failures(25),
    ipFailureTimes: [],
  });
  assert.equal(result.limited, true);
  assert.equal(result.reason, "ACCOUNT");
  assert.equal(result.retryAfterSeconds, 25 * 60 - 1);
});

test("account lock timestamp is exactly 25 minutes after the 25th failure", () => {
  const failureTimes = failures(25, 0);
  const result = calculateLoginRateLimit({ nowMs, accountFailureTimes: failureTimes, ipFailureTimes: [] });
  assert.equal(result.blockedUntilMs, failureTimes.at(-1)!.getTime() + ACCOUNT_FAILURE_WINDOW_MS);
  assert.equal(result.retryAfterSeconds, 25 * 60);
});

test("a request during lock does not extend the original end time", () => {
  const failureTimes = failures(25, 0);
  const first = calculateLoginRateLimit({ nowMs, accountFailureTimes: failureTimes, ipFailureTimes: [] });
  const tenMinutesLater = calculateLoginRateLimit({
    nowMs: nowMs + 10 * 60 * 1000,
    accountFailureTimes: failureTimes,
    ipFailureTimes: [],
  });
  assert.equal(tenMinutesLater.blockedUntilMs, first.blockedUntilMs);
  assert.equal(tenMinutesLater.retryAfterSeconds, 15 * 60);
});

test("login is available immediately when 25 minutes expire", () => {
  const result = calculateLoginRateLimit({
    nowMs: nowMs + 25 * 60 * 1000,
    accountFailureTimes: failures(25, 0),
    ipFailureTimes: [],
  });
  assert.equal(result.limited, false);
});

test("a successful login starts an empty post-success failure cycle", () => {
  const result = calculateLoginRateLimit({ nowMs, accountFailureTimes: [], ipFailureTimes: [] });
  assert.equal(result.limited, false);
});

test("shared IP remains usable below the independent abuse threshold", () => {
  const result = calculateLoginRateLimit({
    nowMs,
    accountFailureTimes: [],
    ipFailureTimes: failures(24),
  });
  assert.equal(result.limited, false);
});

test("high-volume IP abuse is still blocked independently", () => {
  const result = calculateLoginRateLimit({
    nowMs,
    accountFailureTimes: [],
    ipFailureTimes: failures(25),
  });
  assert.equal(result.limited, true);
  assert.equal(result.reason, "IP");
});
