import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const statuses = new Set(["OPEN", "IN_PROGRESS", "POSTPONED", "CLOSED", "CANCELLED"]);
const priorities = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);
const actionTypes = new Set(["CALL", "EMAIL", "WHATSAPP", "TELEGRAM", "MEETING", "KYC", "DEPOSIT_FOLLOW_UP", "FOLLOW_UP", "TASK", "OTHER"]);
const editableFields = ["title", "description", "type", "priority", "dueAt", "endAt", "allDay", "managerId", "reminderMinutes"];

async function session() {
  const store = await cookies();
  const value = await verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
  return value && ["ADMIN", "MANAGER"].includes(value.role) ? value : null;
}
async function accessible(id: string, actor: { sub: string; role: string }) {
  const action = await prisma.clientAction.findUnique({ where: { id }, include: { user: { select: { managerId: true } } } });
  return action && (actor.role === "ADMIN" || action.managerId === actor.sub || action.user.managerId === actor.sub) ? action : null;
}
const reminderAt = (due: Date, minutes: number | null) => minutes === null ? null : new Date(due.getTime() - minutes * 60_000);

export async function GET(req: Request) {
  await ensureCrmSchema(); const actor = await session();
  if (!actor) return Response.json({ error: "Session expired" }, { status: 401 });
  const actionId = new URL(req.url).searchParams.get("actionId") || "";
  if (!(await accessible(actionId, actor))) return Response.json({ error: "Action not found" }, { status: 404 });
  return Response.json({ history: await prisma.clientActionHistory.findMany({ where: { actionId }, orderBy: { createdAt: "desc" }, take: 100 }) });
}

export async function POST(req: Request) {
  try {
    await ensureCrmSchema(); const actor = await session();
    if (!actor) return Response.json({ error: "Session expired" }, { status: 401 });
    const body = await req.json(); const userId = body.clientId || body.userId;
    if (!userId || !String(body.title || "").trim() || !body.dueAt) return Response.json({ error: "Заполните клиента, название и дату" }, { status: 400 });
    const client = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
    if (!client || (actor.role === "MANAGER" && client.managerId !== actor.sub)) return Response.json({ error: "Недостаточно прав" }, { status: 403 });
    const dueAt = new Date(body.dueAt); if (Number.isNaN(dueAt.getTime())) return Response.json({ error: "Некорректная дата" }, { status: 400 });
    const minutes = body.reminderMinutes === null || body.reminderMinutes === "" || body.reminderMinutes === undefined ? null : Number(body.reminderMinutes);
    const action = await prisma.$transaction(async tx => {
      const created = await tx.clientAction.create({ data: { userId, managerId: actor.role === "MANAGER" ? actor.sub : body.managerId || null, title: String(body.title).trim(), description: String(body.description || "").trim() || null, type: String(body.type || "TASK"), priority: priorities.has(body.priority) ? body.priority : "NORMAL", dueAt, endAt: body.endAt ? new Date(body.endAt) : null, allDay: Boolean(body.allDay), reminderMinutes: minutes, reminderAt: reminderAt(dueAt, minutes), reminderState: minutes === null ? "DISMISSED" : "SCHEDULED" } });
      await tx.clientActionHistory.create({ data: { actionId: created.id, userId: actor.sub, event: "CREATED", newValue: JSON.stringify(created) } }); return created;
    }); return Response.json(action);
  } catch (error) { console.error("Client action create error:", error); return Response.json({ error: "Server error" }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema(); const actor = await session();
    if (!actor) return Response.json({ error: "Session expired" }, { status: 401 });
    const body = await req.json(); const previous = body.actionId ? await accessible(body.actionId, actor) : null;
    if (!previous) return Response.json({ error: "Action not found" }, { status: 404 });
    if (["CLOSED", "CANCELLED"].includes(previous.status) && editableFields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
      return Response.json({ error: "Завершённое или отменённое действие нельзя редактировать" }, { status: 409 });
    }
    if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) return Response.json({ error: "Укажите название действия" }, { status: 400 });
    if (body.type !== undefined && !actionTypes.has(String(body.type))) return Response.json({ error: "Некорректный тип действия" }, { status: 400 });
    const dueAt = body.dueAt !== undefined ? new Date(body.dueAt) : previous.dueAt;
    if (!dueAt || Number.isNaN(dueAt.getTime())) return Response.json({ error: "Некорректная дата" }, { status: 400 });
    const endAt = body.endAt !== undefined ? (body.endAt ? new Date(body.endAt) : null) : previous.endAt;
    if (endAt && (Number.isNaN(endAt.getTime()) || endAt <= dueAt)) return Response.json({ error: "Окончание должно быть позже начала" }, { status: 400 });
    const minutes = body.reminderMinutes !== undefined ? (body.reminderMinutes === null || body.reminderMinutes === "" ? null : Number(body.reminderMinutes)) : previous.reminderMinutes;
    if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) return Response.json({ error: "Некорректное напоминание" }, { status: 400 });
    const event = body.operation === "snooze" ? "REMINDER_SNOOZED" : body.status === "CLOSED" ? "COMPLETED" : body.status === "CANCELLED" ? "CANCELLED" : body.dueAt ? "RESCHEDULED" : "EDITED";
    const result = await prisma.$transaction(async tx => {
      const action = await tx.clientAction.update({ where: { id: body.actionId }, data: {
        ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim() } : {}), ...(typeof body.description === "string" ? { description: body.description.trim() || null } : {}),
        ...(body.type ? { type: String(body.type) } : {}), ...(priorities.has(body.priority) ? { priority: body.priority } : {}), ...(body.status && statuses.has(body.status) ? { status: body.status } : {}),
        ...(body.dueAt ? { dueAt, reminderAt: reminderAt(dueAt, minutes), reminderState: minutes === null ? "DISMISSED" : "SCHEDULED" } : {}), ...(body.endAt !== undefined ? { endAt } : {}), ...(body.allDay !== undefined ? { allDay: Boolean(body.allDay) } : {}),
        ...(body.managerId !== undefined ? { managerId: actor.role === "MANAGER" ? actor.sub : body.managerId || null } : {}), ...(body.reminderMinutes !== undefined ? { reminderMinutes: minutes, reminderAt: dueAt ? reminderAt(dueAt, minutes) : null, reminderState: minutes === null ? "DISMISSED" : "SCHEDULED" } : {}),
        ...(body.operation === "snooze" ? { reminderAt: new Date(Date.now() + Number(body.snoozeMinutes || 5) * 60_000), reminderState: "SNOOZED" } : {}), ...(body.status === "CLOSED" ? { completedAt: new Date(), completedByUserId: actor.sub, outcome: body.outcome || "OTHER", outcomeNote: body.outcomeNote || null, reminderState: "COMPLETED" } : {}), ...(body.status === "CANCELLED" ? { cancelledAt: new Date(), reminderState: "CANCELLED" } : {}) } });
      await tx.clientActionHistory.create({ data: { actionId: action.id, userId: actor.sub, event, oldValue: JSON.stringify(previous), newValue: JSON.stringify(action) } });
      let nextAction = null; if (body.nextAction?.title && body.nextAction?.dueAt) { const nextDue = new Date(body.nextAction.dueAt); const nextMinutes = Number(body.nextAction.reminderMinutes ?? 15); nextAction = await tx.clientAction.create({ data: { userId: previous.userId, managerId: body.nextAction.managerId || previous.managerId, title: body.nextAction.title, type: body.nextAction.type || previous.type, priority: body.nextAction.priority || "NORMAL", dueAt: nextDue, reminderMinutes: nextMinutes, reminderAt: reminderAt(nextDue, nextMinutes) } }); await tx.clientActionHistory.create({ data: { actionId: nextAction.id, userId: actor.sub, event: "NEXT_ACTION_CREATED", newValue: JSON.stringify(nextAction) } }); }
      return { action, nextAction };
    }); return Response.json(result);
  } catch (error) { console.error("Client action update error:", error); return Response.json({ error: "Server error" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  await ensureCrmSchema(); const actor = await session(); if (!actor) return Response.json({ error: "Session expired" }, { status: 401 });
  const { actionId } = await req.json(); if (!actionId || !(await accessible(actionId, actor))) return Response.json({ error: "Action not found" }, { status: 404 });
  await prisma.clientAction.delete({ where: { id: actionId } }); return Response.json({ ok: true });
}
