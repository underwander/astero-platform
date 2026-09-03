export const ACCOUNT_FAILURE_WINDOW_MS = 25 * 60 * 1000;
export const IP_FAILURE_WINDOW_MS = 5 * 60 * 1000;

export const ACCOUNT_LOCK_FAILURES = 25;
const IP_LOCK_FAILURES = 25;
const IP_LOCK_SECONDS = 2 * 60;

type RateLimitInput = {
  nowMs: number;
  accountFailureTimes: Date[];
  ipFailureTimes: Date[];
};

export type LoginRateLimit = {
  limited: boolean;
  retryAfterSeconds: number;
  blockedUntilMs: number | null;
  reason: "ACCOUNT" | "IP" | null;
  accountFailures: number;
  ipFailures: number;
};

function secondsUntil(nowMs: number, timestamp: Date, durationMs: number) {
  return Math.max(1, Math.ceil((timestamp.getTime() + durationMs - nowMs) / 1000));
}

export function calculateLoginRateLimit({
  nowMs,
  accountFailureTimes,
  ipFailureTimes,
}: RateLimitInput): LoginRateLimit {
  const latestAccountFailure = accountFailureTimes.at(-1);
  const accountBlockedUntilMs = latestAccountFailure
    ? latestAccountFailure.getTime() + ACCOUNT_FAILURE_WINDOW_MS
    : 0;
  if (
    latestAccountFailure &&
    accountFailureTimes.length >= ACCOUNT_LOCK_FAILURES &&
    accountBlockedUntilMs > nowMs
  ) {
    return {
      limited: true,
      retryAfterSeconds: secondsUntil(nowMs, latestAccountFailure, ACCOUNT_FAILURE_WINDOW_MS),
      blockedUntilMs: accountBlockedUntilMs,
      reason: "ACCOUNT",
      accountFailures: accountFailureTimes.length,
      ipFailures: ipFailureTimes.length,
    };
  }

  const latestIpFailure = ipFailureTimes.at(-1);
  const ipBlockedUntilMs = latestIpFailure
    ? latestIpFailure.getTime() + IP_LOCK_SECONDS * 1000
    : 0;
  if (latestIpFailure && ipFailureTimes.length >= IP_LOCK_FAILURES && ipBlockedUntilMs > nowMs) {
    return {
      limited: true,
      retryAfterSeconds: secondsUntil(nowMs, latestIpFailure, IP_LOCK_SECONDS * 1000),
      blockedUntilMs: ipBlockedUntilMs,
      reason: "IP",
      accountFailures: accountFailureTimes.length,
      ipFailures: ipFailureTimes.length,
    };
  }

  return { limited: false, retryAfterSeconds: 0, blockedUntilMs: null, reason: null, accountFailures: accountFailureTimes.length, ipFailures: ipFailureTimes.length };
}
