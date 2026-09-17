import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const CLOSED = ["CLOSED", "CANCELLED"];

function startOfDay(value: string | null) {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000);
}

function dateBoundary(value: string | null, timezoneOffset: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return startOfDay(value);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + timezoneOffset * 60_000);
}

function personName(value?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  return [value?.firstName, value?.lastName].filter(Boolean).join(" ") || value?.email || "Сотрудник";
}

function historyRange(period: string, from: string | null, to: string | null) {
  const today = startOfDay(null);
  if (period === "yesterday") return { gte: addDays(today, -1), lt: today };
  if (period === "7days") return { gte: addDays(today, -6), lt: addDays(today, 1) };
  if (period === "30days") return { gte: addDays(today, -29), lt: addDays(today, 1) };
  if (period === "custom") {
    const gte = startOfDay(from);
    const lt = addDays(startOfDay(to || from), 1);
    return { gte, lt };
  }
  return { gte: today, lt: addDays(today, 1) };
}

function describeAction(event: string, title: string, client: string) {
  const labels: Record<string, string> = {
    CREATED: "создал действие",
    COMPLETED: "выполнил действие",
    RESCHEDULED: "перенёс срок действия",
    EDITED: "изменил действие",
    CANCELLED: "отменил действие",
    REMINDER_SNOOZED: "отложил напоминание",
    NEXT_ACTION_CREATED: "создал следующее действие",
  };
  return `${labels[event] || "обновил действие"} «${title}» для клиента ${client}`;
}

export async function GET(req: Request) {
  try {
    await ensureCrmSchema();
    const store = await cookies();
    const session = await verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    const params = new URL(req.url).searchParams;
    const requestedManagerId = params.get("managerId") || session.sub;
    // This is the same chief-administrator convention already used by the CRM manager filter.
    const canInspectTeam = session.role === "ADMIN" && session.email === "test6@test.com";
    const allManagers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] }, isBlocked: false },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
      orderBy: [{ firstName: "asc" }, { email: "asc" }],
    });
    const knownManager = allManagers.some((item) => item.id === requestedManagerId);
    if (!canInspectTeam && requestedManagerId !== session.sub) {
      return Response.json({ error: "Недостаточно прав" }, { status: 403 });
    }
    if (requestedManagerId !== "all" && !knownManager) {
      return Response.json({ error: "Сотрудник не найден" }, { status: 404 });
    }
    if (requestedManagerId === "all" && !canInspectTeam) {
      return Response.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const selectedManager = requestedManagerId === "all"
      ? null
      : allManagers.find((item) => item.id === requestedManagerId)!;
    const managerIds = requestedManagerId === "all"
      ? allManagers.map((item) => item.id)
      : [requestedManagerId];
    const rawTimezoneOffset = Number(params.get("timezoneOffset") || 0);
    const timezoneOffset = Number.isFinite(rawTimezoneOffset) ? Math.max(-840, Math.min(840, rawTimezoneOffset)) : 0;
    const selectedDay = dateBoundary(params.get("date"), timezoneOffset);
    const dayEnd = addDays(selectedDay, 1);
    const now = new Date();
    const clientWhere = requestedManagerId === "all" ? { managerId: { in: managerIds } } : { managerId: requestedManagerId };
    const actionScope = requestedManagerId === "all" ? { managerId: { in: managerIds } } : { managerId: requestedManagerId };

    if (params.get("calendarOnly") === "1") {
      const calendarMonth = params.get("calendarMonth") || "";
      const match = /^(\d{4})-(\d{2})$/.exec(calendarMonth);
      if (!match) return Response.json({ error: "Некорректный месяц" }, { status: 400 });
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (year < 1900 || year > 2200 || monthIndex < 0 || monthIndex > 11) return Response.json({ error: "Некорректный месяц" }, { status: 400 });
      const rangeStart = new Date(Date.UTC(year, monthIndex, 1) + timezoneOffset * 60_000);
      const rangeEnd = new Date(Date.UTC(year, monthIndex + 1, 1) + timezoneOffset * 60_000);
      const monthTasks = await prisma.clientAction.findMany({
        where: { ...actionScope, type: "TASK", dueAt: { gte: rangeStart, lt: rangeEnd } },
        select: { dueAt: true, status: true },
      });
      const counts: Record<string, { total: number; completed: number }> = {};
      for (const task of monthTasks) {
        if (!task.dueAt) continue;
        const localTime = new Date(task.dueAt.getTime() - timezoneOffset * 60_000);
        const key = localTime.toISOString().slice(0, 10);
        counts[key] ??= { total: 0, completed: 0 };
        counts[key].total += 1;
        if (task.status === "CLOSED") counts[key].completed += 1;
      }
      return Response.json({ month: calendarMonth, counts }, { headers: { "Cache-Control": "no-store" } });
    }

    const actions = await prisma.clientAction.findMany({
      where: {
        ...actionScope,
        type: "TASK",
        OR: [
          { dueAt: { gte: selectedDay, lt: dayEnd } },
          { dueAt: { lt: now }, status: { notIn: CLOSED } },
          { dueAt: { gte: dayEnd, lt: addDays(dayEnd, 7) }, status: { notIn: CLOSED } },
        ],
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        manager: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 200,
    });

    const [newClients, activeDeals, closedDeals, notesToday, calls, meetings, availableClients] = await Promise.all([
      prisma.user.count({ where: { ...clientWhere, createdAt: { gte: selectedDay, lt: dayEnd } } }),
      prisma.trade.count({ where: { user: clientWhere, closedAt: null } }),
      prisma.trade.count({ where: { user: clientWhere, closedAt: { gte: selectedDay, lt: dayEnd } } }),
      prisma.clientNote.count({ where: { managerId: requestedManagerId === "all" ? { in: managerIds } : requestedManagerId, createdAt: { gte: selectedDay, lt: dayEnd } } }),
      prisma.clientAction.count({ where: { ...actionScope, type: "CALL", dueAt: { gte: selectedDay, lt: dayEnd } } }),
      prisma.clientAction.count({ where: { ...actionScope, type: "MEETING", dueAt: { gte: selectedDay, lt: dayEnd } } }),
      prisma.user.findMany({
        where: { ...clientWhere, role: "CLIENT" },
        select: { id: true, email: true, firstName: true, lastName: true },
        orderBy: [{ firstName: "asc" }, { email: "asc" }],
        take: 500,
      }),
    ]);

    const scheduledToday = actions.filter((item) => item.dueAt && item.dueAt >= selectedDay && item.dueAt < dayEnd);
    const completedToday = scheduledToday.filter((item) => item.status === "CLOSED");
    const overdue = actions.filter((item) => item.dueAt && item.dueAt < now && !CLOSED.includes(item.status));
    const nextAction = actions.find((item) => item.dueAt && item.dueAt >= now && !CLOSED.includes(item.status)) || null;

    const attentionClients = await prisma.user.findMany({
      where: {
        ...clientWhere,
        clientActions: { some: { type: "TASK", status: { notIn: CLOSED }, dueAt: { lt: dayEnd } } },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        clientActions: {
          where: { type: "TASK", status: { notIn: CLOSED }, dueAt: { lt: dayEnd } },
          select: { id: true, title: true, dueAt: true, priority: true },
          orderBy: { dueAt: "asc" }, take: 1,
        },
      },
      take: 8,
    });

    const historyPeriod = params.get("historyPeriod") || "today";
    const range = historyRange(historyPeriod, params.get("historyFrom"), params.get("historyTo"));
    const historyType = params.get("historyType") || "all";
    const historySearch = (params.get("historySearch") || "").trim().toLocaleLowerCase("ru");
    const page = Math.max(1, Number(params.get("historyPage") || 1));
    const pageSize = Math.min(50, Math.max(10, Number(params.get("historyPageSize") || 15)));
    const fetchLimit = Math.min(500, page * pageSize + 50);

    const [actionHistory, notes, logins] = await Promise.all([
      historyType === "all" || historyType === "actions"
        ? prisma.clientActionHistory.findMany({
            where: { userId: { in: managerIds }, createdAt: range },
            orderBy: { createdAt: "desc" }, take: fetchLimit,
          })
        : [],
      historyType === "all" || historyType === "notes"
        ? prisma.clientNote.findMany({
            where: { managerId: { in: managerIds }, createdAt: range },
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
              manager: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" }, take: fetchLimit,
          })
        : [],
      historyType === "all" || historyType === "logins"
        ? prisma.securityEvent.findMany({
            where: { userId: { in: managerIds }, createdAt: range, type: { in: ["LOGIN_SUCCESS", "LOGIN_FAILED"] } },
            orderBy: { createdAt: "desc" }, take: fetchLimit,
          })
        : [],
    ]);

    const actionIds = [...new Set(actionHistory.map((item) => item.actionId))];
    const relatedActions = actionIds.length
      ? await prisma.clientAction.findMany({
          where: { id: { in: actionIds } },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        })
      : [];
    const actionMap = new Map(relatedActions.map((item) => [item.id, item]));
    const managerMap = new Map(allManagers.map((item) => [item.id, item]));

    const history = [
      ...actionHistory.map((item) => {
        const action = actionMap.get(item.actionId);
        const actor = item.userId ? managerMap.get(item.userId) : null;
        return {
          id: `action-${item.id}`, createdAt: item.createdAt, type: "actions",
          actor: personName(actor), description: describeAction(item.event, action?.title || "Действие", personName(action?.user)),
          href: action?.userId ? `/crm?tab=clientCard&clientId=${encodeURIComponent(action.userId)}` : "/crm?tab=actions",
        };
      }),
      ...notes.map((item) => ({
        id: `note-${item.id}`, createdAt: item.createdAt, type: "notes", actor: personName(item.manager),
        description: `добавил заметку клиенту ${personName(item.user)}: ${item.text}`,
        href: `/crm?tab=clientCard&clientId=${encodeURIComponent(item.userId)}`,
      })),
      ...logins.map((item) => ({
        id: `login-${item.id}`, createdAt: item.createdAt, type: "logins", actor: personName(managerMap.get(item.userId || "")),
        description: item.type === "LOGIN_SUCCESS" ? "вошёл в CRM" : "неуспешно пытался войти в CRM",
        href: "/crm",
      })),
    ]
      .filter((item) => !historySearch || `${item.actor} ${item.description}`.toLocaleLowerCase("ru").includes(historySearch))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const historyTotal = history.length;
    const historyPage = history.slice((page - 1) * pageSize, page * pageSize);

    return Response.json({
      viewer: { id: session.sub, role: session.role, canInspectTeam },
      selectedManager: selectedManager || { id: "all", firstName: "Вся", lastName: "команда", email: "" },
      managers: canInspectTeam ? allManagers : [],
      clients: availableClients,
      selectedDate: selectedDay.toISOString(),
      metrics: {
        tasksToday: scheduledToday.length, completed: completedToday.length, overdue: overdue.length,
        newClients, calls, meetings, activeDeals, closedDeals, notes: notesToday,
        progress: scheduledToday.length ? Math.round((completedToday.length / scheduledToday.length) * 100) : 0,
      },
      nextAction,
      actions,
      attentionClients: attentionClients.map((client) => ({ ...client, reason: client.clientActions[0]?.dueAt && client.clientActions[0].dueAt < new Date() ? "Просрочено действие" : "Требуется действие сегодня" })),
      history: historyPage,
      historyPagination: { page, pageSize, total: historyTotal, hasNext: page * pageSize < historyTotal || history.length === fetchLimit },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Workspace overview error", error);
    return Response.json({ error: "Не удалось загрузить обзор" }, { status: 500 });
  }
}
