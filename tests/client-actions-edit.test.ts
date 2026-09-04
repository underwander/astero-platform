import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspace = readFileSync("src/components/admin/ActionsWorkspace.tsx", "utf8");
const calendar = readFileSync("src/components/admin/ActionsCalendarClient.tsx", "utf8");
const route = readFileSync("src/app/api/admin/client-actions/route.ts", "utf8");

test("only the selected action row enters inline edit mode", () => {
  assert.match(workspace, /editingId === action\.id/);
  assert.match(workspace, /<InlineActionRow/);
  assert.doesNotMatch(workspace, /mode="edit"/);
});

test("edit submits every supported mutable action field", () => {
  const editStart = workspace.indexOf("async function saveEditedAction");
  const editEnd = workspace.indexOf("function openCreate", editStart);
  const editHandler = workspace.slice(editStart, editEnd);
  for (const field of ["type", "title", "description", "dueAt", "endAt", "allDay", "priority", "reminderMinutes", "managerId"]) {
    assert.match(editHandler, new RegExp(`${field}:`));
  }
});

test("the list exposes inline editing without an edit modal", () => {
  assert.match(workspace, /title="Редактировать"/);
  assert.match(workspace, /<CreateActionModal/);
  assert.doesNotMatch(workspace, /Редактировать действие/);
  assert.match(workspace, /Сохранить<\/button><button[\s\S]*Отмена/);
});

test("inline editing renders compact controls for every requested field", () => {
  for (const label of ["Дата действия", "Время действия", "Название действия", "Описание действия", "Тип действия", "Ответственный менеджер", "Приоритет", "Напоминание"]) {
    assert.match(workspace, new RegExp(`aria-label="${label}"`));
  }
  assert.match(workspace, /max-h-24 min-h-14/);
});

test("inline keyboard controls save safe inputs and cancel with Escape", () => {
  assert.match(workspace, /event\.key === "Escape"/);
  assert.match(workspace, /event\.key === "Enter"/);
  assert.match(workspace, /HTMLInputElement/);
  assert.match(workspace, /void onSave\(\)/);
  assert.match(workspace, /onCancel\(\)/);
});

test("changing inline date or time keeps the existing action duration", () => {
  assert.match(workspace, /function moveActionStart/);
  assert.match(workspace, /previousEnd\.getTime\(\) - previousStart\.getTime\(\)/);
  assert.match(workspace, /nextStart\.getTime\(\) \+ duration/);
  assert.match(workspace, /replaceLocalDatePart/);
  assert.match(workspace, /replaceLocalTimePart/);
});

test("successful patches update the current view before reloading persistence", () => {
  const localPatch = workspace.indexOf("setActionPatches((current)");
  const reload = workspace.indexOf("await reload()", localPatch);
  assert.ok(localPatch >= 0 && reload > localPatch);
  assert.match(workspace, /Действие обновлено/);
  assert.match(workspace, /Не удалось обновить действие/);
});

test("calendar movement persists start and end and final actions are immutable", () => {
  assert.match(workspace, /onMove=\{async \(id, start, end\)[\s\S]*dueAt: start\.toISOString\(\)[\s\S]*endAt: end\?\.toISOString\(\)/);
  assert.match(workspace, /editable: !isFinalAction\(action\)/);
  assert.match(calendar, /editable: event\.editable/);
  assert.match(route, /\["CLOSED", "CANCELLED"\]\.includes\(previous\.status\)/);
});

test("changing date or reminder recalculates the persisted reminder", () => {
  assert.match(route, /body\.dueAt[\s\S]*reminderAt: reminderAt\(dueAt, minutes\)/);
  assert.match(route, /body\.reminderMinutes[\s\S]*reminderAt: dueAt \? reminderAt\(dueAt, minutes\) : null/);
});
