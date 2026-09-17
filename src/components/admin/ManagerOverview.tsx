"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Person = { id: string; email: string; firstName?: string | null; lastName?: string | null; role?: string };
type Action = {
  id: string; title: string; description?: string | null; dueAt?: string | null; endAt?: string | null;
  status: string; priority?: string; type?: string; user: Person; manager?: Person | null;
};
type HistoryItem = { id: string; createdAt: string; actor: string; description: string; type: string; href: string };
type OverviewData = {
  viewer: { id: string; role: string; canInspectTeam: boolean };
  selectedManager: Person; managers: Person[]; selectedDate: string;
  metrics: { tasksToday: number; completed: number; overdue: number; newClients: number; calls: number; meetings: number; activeDeals: number; closedDeals: number; notes: number; progress: number };
  nextAction: Action | null; actions: Action[];
  attentionClients: Array<Person & { reason: string; clientActions: Array<{ id: string; title: string; dueAt?: string | null; priority?: string }> }>;
  history: HistoryItem[]; historyPagination: { page: number; pageSize: number; total: number; hasNext: boolean };
};

const closed = new Set(["CLOSED", "CANCELLED"]);
const statusLabels: Record<string, string> = { OPEN: "Запланировано", IN_PROGRESS: "В работе", POSTPONED: "Перенесено", CLOSED: "Выполнено", CANCELLED: "Отменено" };
const priorityLabels: Record<string, string> = { LOW: "Низкий", NORMAL: "Обычный", HIGH: "Высокий", URGENT: "Срочный" };
const typeLabels: Record<string, string> = { TASK: "Задача", CALL: "Звонок", MEETING: "Встреча", EMAIL: "Письмо", FOLLOW_UP: "Повторный контакт", OTHER: "Другое" };

function name(person?: Person | null) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.email || "Сотрудник";
}

function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default function ManagerOverview() {
  const [managerId, setManagerId] = useState("");
  const [managerSearch, setManagerSearch] = useState("");
  const [date, setDate] = useState(localDateInput());
  const [historyPeriod, setHistoryPeriod] = useState("today");
  const [historyType, setHistoryType] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFrom, setHistoryFrom] = useState(localDateInput());
  const [historyTo, setHistoryTo] = useState(localDateInput());
  const [historyPage, setHistoryPage] = useState(1);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ date, historyPeriod, historyType, historySearch, historyFrom, historyTo, historyPage: String(historyPage), historyPageSize: "15" });
    if (managerId) params.set("managerId", managerId);
    try {
      const response = await fetch(`/api/admin/workspace-overview?${params}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Не удалось загрузить данные");
      setData(payload);
      setManagerId((current) => current || payload.selectedManager.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить данные");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date, historyFrom, historyPage, historyPeriod, historySearch, historyTo, historyType, managerId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(timer); }, [load]);

  async function updateAction(actionId: string, patch: Record<string, unknown>) {
    const response = await fetch("/api/admin/client-actions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionId, ...patch }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) { setError(payload?.error || "Не удалось обновить задачу"); return; }
    await load();
  }

  const filteredManagers = useMemo(() => {
    const query = managerSearch.trim().toLocaleLowerCase("ru");
    return (data?.managers || []).filter((item) => !query || `${name(item)} ${item.email}`.toLocaleLowerCase("ru").includes(query));
  }, [data?.managers, managerSearch]);

  if (!data && loading) return <OverviewSkeleton />;
  if (!data) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error || "Обзор недоступен"}</div>;

  const selectedName = data.selectedManager.id === "all" ? "команда" : name(data.selectedManager).split(" ")[0];
  const selectedDay = new Date(`${date}T12:00:00`);
  const todayActions = data.actions.filter((item) => item.dueAt && localDateInput(new Date(item.dueAt)) === date);
  const overdue = data.actions.filter((item) => item.dueAt && new Date(item.dueAt) < new Date(`${date}T00:00:00`) && !closed.has(item.status));
  const inProgress = todayActions.filter((item) => item.status === "IN_PROGRESS");
  const done = todayActions.filter((item) => item.status === "CLOSED");
  const planned = todayActions.filter((item) => item.status === "OPEN" || item.status === "POSTPONED");
  const future = data.actions.filter((item) => item.dueAt && new Date(item.dueAt) >= new Date(`${date}T24:00:00`) && !closed.has(item.status));
  const readOnly = data.selectedManager.id !== data.viewer.id;

  return (
    <div className="space-y-4" aria-busy={loading}>
      <section className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Рабочий день · {selectedDay.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {selectedName}!</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/80">Сегодня запланировано {data.metrics.tasksToday} задач, {data.metrics.meetings} встреч и {data.metrics.calls} звонков. {data.metrics.overdue > 0 ? `Просрочено: ${data.metrics.overdue}.` : "Просроченных задач нет."}</p>
          </div>
          {data.viewer.canInspectTeam && <div className="w-full rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur xl:max-w-sm">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">Просмотр менеджера</label>
            <input value={managerSearch} onChange={(event) => setManagerSearch(event.target.value)} placeholder="Найти сотрудника..." className="mt-2 h-9 w-full rounded-lg border border-white/15 bg-slate-950/35 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-emerald-300" />
            <select value={managerId} onChange={(event) => { setManagerId(event.target.value); setHistoryPage(1); }} className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300">
              <option value={data.viewer.id}>Мой обзор</option>
              <option value="all">Общая сводка команды</option>
              {filteredManagers.filter((item) => item.id !== data.viewer.id).map((item) => <option key={item.id} value={item.id}>{name(item)} · {item.email}</option>)}
            </select>
          </div>}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div><div className="mb-2 flex items-center justify-between text-xs"><span>Дневной план</span><b>{data.metrics.progress}%</b></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${data.metrics.progress}%` }} /></div></div>
          <div className="text-sm text-emerald-50"><b>{data.metrics.completed}</b> из <b>{data.metrics.tasksToday}</b> выполнено</div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {readOnly && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Режим просмотра: данные выбранного менеджера доступны без действий от его имени.</div>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Задачи сегодня" value={data.metrics.tasksToday} />
        <Metric label="Выполнено" value={data.metrics.completed} tone="green" />
        <Metric label="Просрочено" value={data.metrics.overdue} tone={data.metrics.overdue ? "red" : undefined} />
        <Metric label="Новые клиенты" value={data.metrics.newClients} />
        <Metric label="Звонки" value={data.metrics.calls} />
        <Metric label="Встречи" value={data.metrics.meetings} />
        <Metric label="Активные сделки" value={data.metrics.activeDeals} />
        <Metric label="Закрытые сделки" value={data.metrics.closedDeals} tone="green" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.7fr)]">
        <Card title="План на сегодня" action={!readOnly ? <a href="/crm?tab=actions" className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800">+ Добавить задачу</a> : undefined}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Дата</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
            <button type="button" onClick={() => setDate(localDateInput())} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Сегодня</button>
          </div>
          <div className="space-y-5">
            <TaskGroup title="Просроченные" actions={overdue} tone="red" onUpdate={updateAction} readOnly={readOnly} />
            <TaskGroup title="На сегодня" actions={planned} onUpdate={updateAction} readOnly={readOnly} />
            <TaskGroup title="В работе" actions={inProgress} tone="blue" onUpdate={updateAction} readOnly={readOnly} />
            <TaskGroup title="Выполненные" actions={done} tone="green" onUpdate={updateAction} readOnly={readOnly} />
            <TaskGroup title="Предстоящие" actions={future} onUpdate={updateAction} readOnly={readOnly} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Ближайшее действие">
            {data.nextAction ? <ActionPreview action={data.nextAction} /> : <Empty text="Ближайших действий нет" />}
          </Card>
          {!readOnly && <Card title="Быстрые действия">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <QuickLink href="/crm?tab=clients" label="Создать клиента" icon="＋" />
              <QuickLink href="/crm?tab=tradeOperations" label="Создать сделку" icon="↗" />
              <QuickLink href="/crm?tab=actions" label="Добавить задачу" icon="✓" />
              <QuickLink href="/crm?tab=actions" label="Встреча" icon="◷" />
              <QuickLink href="/crm?tab=clients" label="Добавить заметку" icon="✎" wide />
            </div>
          </Card>}
          <Card title="Требуют внимания">
            <div className="space-y-2">
              {data.attentionClients.map((client) => <a key={client.id} href={`/crm?tab=clientCard&clientId=${encodeURIComponent(client.id)}`} className="block rounded-lg border border-slate-200 p-3 transition hover:border-amber-300 hover:bg-amber-50/40"><div className="flex justify-between gap-3"><b className="text-sm text-slate-900">{name(client)}</b><span className="text-[10px] font-bold uppercase text-amber-700">{client.reason}</span></div><p className="mt-1 truncate text-xs text-slate-500">{client.clientActions[0]?.title || client.email}</p></a>)}
              {data.attentionClients.length === 0 && <Empty text="Нет клиентов, требующих срочного внимания" />}
            </div>
          </Card>
        </div>
      </section>

      <Card title="История действий">
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[170px_170px_minmax(220px,1fr)_auto]">
          <select value={historyPeriod} onChange={(event) => { setHistoryPeriod(event.target.value); setHistoryPage(1); }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="today">Сегодня</option><option value="yesterday">Вчера</option><option value="7days">Последние 7 дней</option><option value="30days">Последние 30 дней</option><option value="custom">Произвольный период</option></select>
          <select value={historyType} onChange={(event) => { setHistoryType(event.target.value); setHistoryPage(1); }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="all">Все типы</option><option value="actions">Задачи и события</option><option value="notes">Заметки</option><option value="logins">Входы</option></select>
          <input value={historySearch} onChange={(event) => { setHistorySearch(event.target.value); setHistoryPage(1); }} placeholder="Поиск по истории..." className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
          <button type="button" onClick={() => void load()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Обновить</button>
        </div>
        {historyPeriod === "custom" && <div className="mb-4 flex flex-wrap gap-2"><input aria-label="Начало периода" type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" /><input aria-label="Конец периода" type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" /></div>}
        <div className="divide-y divide-slate-100">
          {data.history.map((item) => <a key={item.id} href={item.href} className="grid gap-1 py-3 text-sm transition hover:bg-slate-50 sm:grid-cols-[130px_180px_1fr] sm:px-2"><time className="font-semibold text-slate-500">{new Date(item.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time><b className="text-slate-900">{item.actor}</b><span className="text-slate-600">{item.description}</span></a>)}
          {data.history.length === 0 && <Empty text="За выбранный период действий нет" />}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Страница {data.historyPagination.page} · найдено {data.historyPagination.total}</span><div className="flex gap-2"><button disabled={historyPage <= 1} onClick={() => setHistoryPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Назад</button><button disabled={!data.historyPagination.hasNext} onClick={() => setHistoryPage((value) => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Далее</button></div></div>
      </Card>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-bold text-slate-950">{title}</h3>{action}</div>{children}</section>;
}
function Metric({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) {
  return <div className={`rounded-xl border bg-white p-3 shadow-sm ${tone === "red" ? "border-red-200" : tone === "green" ? "border-emerald-200" : "border-slate-200"}`}><p className="text-[11px] font-semibold leading-4 text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-700" : "text-slate-950"}`}>{value}</p></div>;
}
function TaskGroup({ title, actions, tone, onUpdate, readOnly = false }: { title: string; actions: Action[]; tone?: "red" | "green" | "blue"; onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>; readOnly?: boolean }) {
  if (!actions.length) return null;
  const colors = tone === "red" ? "bg-red-50 text-red-700" : tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "blue" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-700";
  return <div><div className="mb-2 flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${colors}`}>{title}</span><span className="text-xs text-slate-400">{actions.length}</span></div><div className="space-y-2">{actions.map((action) => <div key={action.id} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-slate-950">{action.title}</b><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{priorityLabels[action.priority || "NORMAL"]}</span></div><p className="mt-1 text-xs text-slate-500">{action.dueAt ? new Date(action.dueAt).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "Без срока"} · {typeLabels[action.type || "TASK"] || action.type} · {name(action.user)}</p>{action.description && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{action.description}</p>}</div><div className="flex shrink-0 flex-wrap gap-1">{readOnly ? <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{statusLabels[action.status] || action.status}</span> : <><select aria-label={`Статус: ${action.title}`} value={action.status} disabled={closed.has(action.status)} onChange={(event) => void onUpdate(action.id, { status: event.target.value })} className="h-8 rounded-lg border border-slate-200 px-2 text-xs"><option value="OPEN">Запланировано</option><option value="IN_PROGRESS">В работе</option><option value="POSTPONED">Перенесено</option><option value="CLOSED">Выполнено</option></select>{!closed.has(action.status) && <><button onClick={() => void onUpdate(action.id, { status: "CLOSED" })} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white">Готово</button><button onClick={() => { const next = new Date(action.dueAt || Date.now()); next.setDate(next.getDate() + 1); void onUpdate(action.id, { dueAt: next.toISOString(), status: "POSTPONED" }); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold">+1 день</button></>}</>}<a href={`/crm?tab=clientCard&clientId=${encodeURIComponent(action.user.id)}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold">Клиент</a></div></div></div>)}</div></div>;
}
function ActionPreview({ action }: { action: Action }) { return <div className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{typeLabels[action.type || "TASK"] || action.type}</p><h4 className="mt-2 font-bold">{action.title}</h4><p className="mt-2 text-xs text-slate-300">{action.dueAt ? new Date(action.dueAt).toLocaleString("ru-RU") : "Без срока"}</p><p className="mt-1 text-xs text-slate-400">{name(action.user)}</p><a href={`/crm?tab=clientCard&clientId=${encodeURIComponent(action.user.id)}`} className="mt-4 inline-flex rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950">Открыть запись →</a></div>; }
function QuickLink({ href, label, icon, wide }: { href: string; label: string; icon: string; wide?: boolean }) { return <a href={href} className={`flex items-center gap-2 rounded-lg border border-slate-200 p-3 font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 ${wide ? "col-span-2" : ""}`}><span className="text-emerald-700">{icon}</span>{label}</a>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-400">{text}</p>; }
function OverviewSkeleton() { return <div className="space-y-4" role="status" aria-label="Загрузка обзора"><div className="h-48 animate-pulse rounded-2xl bg-slate-200" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="h-24 animate-pulse rounded-xl bg-slate-100" /><div className="h-24 animate-pulse rounded-xl bg-slate-100" /><div className="h-24 animate-pulse rounded-xl bg-slate-100" /><div className="h-24 animate-pulse rounded-xl bg-slate-100" /></div></div>; }
