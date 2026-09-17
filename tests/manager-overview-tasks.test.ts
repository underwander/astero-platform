import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const overview = readFileSync("src/components/admin/ManagerOverview.tsx", "utf8");
const actionsWorkspace = readFileSync("src/components/admin/ActionsWorkspace.tsx", "utf8");
const overviewApi = readFileSync("src/app/api/admin/workspace-overview/route.ts", "utf8");
const actionsApi = readFileSync("src/app/api/admin/client-actions/route.ts", "utf8");

test("today plan is restricted to TASK records while call and meeting metrics remain separate", () => {
  assert.match(overviewApi, /type: "TASK"/);
  assert.match(overviewApi, /type: "CALL"/);
  assert.match(overviewApi, /type: "MEETING"/);
  assert.match(overview, /item\.type === "TASK"/);
});

test("overview assignment form always persists a task and exposes no action type selector", () => {
  assert.match(overview, /type: "TASK"/);
  assert.match(overview, /Тип: Задача/);
  assert.doesNotMatch(overview, /<option value="CALL">/);
  assert.doesNotMatch(overview, /<option value="MEETING">/);
  assert.match(actionsWorkspace, /type: "TASK"/);
  assert.doesNotMatch(actionsWorkspace, /<Field label="Тип \*"/);
  assert.match(actionsWorkspace, />\+ Назначить задачу<\/button>/);
});

test("task editing supports client reassignment, reopening, and actor-backed history", () => {
  assert.match(actionsApi, /nextUserId = body\.clientId \|\| body\.userId/);
  assert.match(actionsApi, /REOPENED/);
  assert.match(actionsApi, /userId: actor\.sub/);
  assert.match(overview, /Редактировать задачу/);
  assert.match(overview, /Вернуть в работу/);
});
