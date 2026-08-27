import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MAX_DEPOSIT_COMMENT_LENGTH,
  normalizeDepositComment,
  prepareManualBalanceOperation,
  visibleTransactionDescription,
} from "../src/lib/deposit-comment.ts";

test("creates a deposit without a comment", () => {
  const operation = prepareManualBalanceOperation(1000, 500, undefined);
  assert.equal(operation.comment, null);
  assert.equal(operation.description, "Admin deposit");
});

test("creates a deposit with a trimmed comment", () => {
  const operation = prepareManualBalanceOperation(1000, 500, "  Пополнение счёта  ");
  assert.equal(operation.comment, "Пополнение счёта");
  assert.equal(operation.description, "Пополнение счёта");
});

test("deposit amount is credited correctly", () => {
  assert.equal(prepareManualBalanceOperation(1250, 500, null).nextBalance, 1750);
});

test("comment does not affect the resulting balance", () => {
  const withoutComment = prepareManualBalanceOperation(1250, 500, null);
  const withComment = prepareManualBalanceOperation(1250, 500, "Compensație");
  assert.equal(withComment.nextBalance, withoutComment.nextBalance);
});

test("empty comments are accepted as absent", () => {
  assert.equal(normalizeDepositComment("  \r\n  "), null);
});

test("Unicode Cyrillic and Romanian text is preserved", () => {
  assert.equal(normalizeDepositComment("Возврат по страховке №1285 — Compensație"), "Возврат по страховке №1285 — Compensație");
});

test("ordinary punctuation and numbers are preserved", () => {
  assert.equal(normalizeDepositComment("Transfer #1285: USD/EUR, 27.08.2026"), "Transfer #1285: USD/EUR, 27.08.2026");
});

test("a comment at the maximum length is accepted", () => {
  const comment = "ю".repeat(MAX_DEPOSIT_COMMENT_LENGTH);
  assert.equal(normalizeDepositComment(comment), comment);
});

test("an overlong comment is rejected", () => {
  assert.throws(() => normalizeDepositComment("a".repeat(MAX_DEPOSIT_COMMENT_LENGTH + 1)), /must not exceed/);
});

test("a non-string comment is rejected", () => {
  assert.throws(() => normalizeDepositComment({ text: "deposit" }), /must be text/);
});

test("HTML remains inert text for React to escape", () => {
  const html = '<script>alert("xss")</script>';
  assert.equal(normalizeDepositComment(html), html);
  const component = readFileSync("src/components/broker/TransferHistory.tsx", "utf8");
  assert.equal(component.includes("dangerouslySetInnerHTML"), false);
});

test("legacy deposits without public comments keep their previous presentation", () => {
  assert.equal(visibleTransactionDescription("Admin deposit"), null);
  assert.equal(visibleTransactionDescription(null), null);
});

test("a public transaction comment is visible", () => {
  assert.equal(visibleTransactionDescription("Возврат средств"), "Возврат средств");
});

test("manual deposit API writes balance and ledger in one transaction", () => {
  const route = readFileSync("src/app/api/admin/users/deposit/route.ts", "utf8");
  const transactionStart = route.indexOf("prisma.$transaction");
  const transactionEnd = route.indexOf("return { user, operation }", transactionStart);
  assert.ok(transactionStart >= 0 && transactionEnd > transactionStart);
  assert.ok(route.indexOf("tx.user.update", transactionStart) < transactionEnd);
  assert.ok(route.indexOf("tx.balanceHistory.create", transactionStart) < transactionEnd);
  assert.ok(route.indexOf("tx.securityEvent.create", transactionStart) < transactionEnd);
});

test("API returns the created ledger operation including its description", () => {
  const route = readFileSync("src/app/api/admin/users/deposit/route.ts", "utf8");
  assert.match(route, /operation: result\.operation/);
});

test("CRM sends and displays the operation-specific comment", () => {
  const crm = readFileSync("src/components/admin/AsteroCrm.tsx", "utf8");
  assert.match(crm, /comment: depositComment/);
  assert.match(crm, /Комментарий \/ описание/);
  assert.match(crm, /item\.description/);
});

test("client history renders a public description only when present", () => {
  const history = readFileSync("src/components/broker/TransferHistory.tsx", "utf8");
  assert.match(history, /visibleTransactionDescription\(item\.description\)/);
});

test("comments remain isolated per operation input", () => {
  const first = prepareManualBalanceOperation(1000, 100, "Первый депозит");
  const second = prepareManualBalanceOperation(first.nextBalance, 200, "Второй депозит");
  assert.equal(first.description, "Первый депозит");
  assert.equal(second.description, "Второй депозит");
});
