import assert from "node:assert/strict";
import test from "node:test";
import { formatAuthCountdown, safeSessionError } from "../src/lib/auth-ui.ts";

test("lock countdown renders minutes and seconds and reaches zero", () => {
  assert.equal(formatAuthCountdown(24 * 60 + 36), "24:36");
  assert.equal(formatAuthCountdown(1), "00:01");
  assert.equal(formatAuthCountdown(0), "00:00");
});

test("raw Unauthorized and 401 errors are never exposed to the user", () => {
  assert.equal(safeSessionError("Unauthorized", true), "Сессия завершена. Войдите снова.");
  assert.equal(safeSessionError("401 Unauthorized", false), "Your session has ended. Please sign in again.");
  assert.doesNotMatch(safeSessionError("Unauthorized", false) || "", /unauthorized|401/i);
});
