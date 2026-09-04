"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CalendarAction } from "@/components/admin/ActionsCalendarClient";

const ActionsCalendar = dynamic(() => import("@/components/admin/ActionsCalendarClient"), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

type Person = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  clientNumber?: string | null;
};

export type ActionItem = {
  id: string;
  managerId?: string | null;
  title?: string | null;
  description?: string | null;
  dueAt?: string | null;
  endAt?: string | null;
  allDay?: boolean | null;
  reminderMinutes?: number | null;
  reminderAt?: string | null;
  reminderState?: string | null;
  status?: string | null;
  type?: string | null;
  priority?: string | null;
  outcome?: string | null;
  outcomeNote?: string | null;
  manager?: Person | null;
  client?: Person | null;
};

type Client = Person & { clientActions?: Omit<ActionItem, "client">[] | null };
type History = { id: string; event: string; createdAt: string; oldValue?: string | null; newValue?: string | null };
type Props = { clients: Client[]; managers: Person[]; reload: () => Promise<void>; openClient: (id: string) => void };
type View = "list" | "calendar";
type Mode = "day" | "week" | "month";
type Section = "all" | "today" | "overdue" | "upcoming" | "completed";

const actionTypes = ["CALL", "EMAIL", "WHATSAPP", "TELEGRAM", "MEETING", "KYC", "DEPOSIT_FOLLOW_UP", "FOLLOW_UP", "TASK", "OTHER"];
const typeNames: Record<string, string> = { CALL: "Звонок", EMAIL: "Email", WHATSAPP: "WhatsApp", TELEGRAM: "Telegram", MEETING: "Встреча", KYC: "KYC", DEPOSIT_FOLLOW_UP: "Депозит", FOLLOW_UP: "Follow-up", TASK: "Задача", OTHER: "Другое" };
const statusNames: Record<string, string> = { OPEN: "Запланировано", IN_PROGRESS: "Срок наступил", POSTPONED: "Перенесено", CLOSED: "Выполнено", CANCELLED: "Отменено" };
const priorityNames: Record<string, string> = { LOW: "Низкий", NORMAL: "Обычный", HIGH: "Высокий", URGENT: "Срочный" };
const validModes = new Set<Mode>(["day", "week", "month"]);
const validSections = new Set<Section>(["all", "today", "overdue", "upcoming", "completed"]);
const warnedInvalidActionIds = new Set<string>();

function personName(person?: Person | null) {
  if (!person) return "Клиент недоступен";
  return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || "Клиент недоступен";
}

function validDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function todayValue() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function safeUrlDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return todayValue();
  return validDate(`${value}T12:00:00`) ? value : todayValue();
}

function localInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function emptyForm() {
  const start = new Date(Date.now() + 3_600_000);
  return { clientId: "", type: "CALL", title: "", description: "", dueAt: localInput(start), endAt: localInput(new Date(start.getTime() + 1_800_000)), allDay: false, priority: "NORMAL", reminderMinutes: "15", managerId: "" };
}

type ActionForm = ReturnType<typeof emptyForm>;

function formFromAction(action: ActionItem): ActionForm {
  const start = validDate(action.dueAt) || new Date();
  const suppliedEnd = validDate(action.endAt);
  return {
    clientId: action.client?.id || "",
    type: action.type && actionTypes.includes(action.type) ? action.type : "TASK",
    title: action.title || "",
    description: action.description || "",
    dueAt: localInput(start),
    endAt: suppliedEnd && suppliedEnd > start ? localInput(suppliedEnd) : "",
    allDay: Boolean(action.allDay),
    priority: action.priority && priorityNames[action.priority] ? action.priority : "NORMAL",
    reminderMinutes: action.reminderMinutes == null ? "" : String(action.reminderMinutes),
    managerId: action.manager?.id || action.managerId || "",
  };
}

function replaceLocalDatePart(value: string, date: string) {
  return `${date}T${value.slice(11, 16) || "09:00"}`;
}

function replaceLocalTimePart(value: string, time: string) {
  return `${value.slice(0, 10) || todayValue()}T${time}`;
}

function moveActionStart(form: ActionForm, dueAt: string): ActionForm {
  const previousStart = validDate(form.dueAt);
  const previousEnd = validDate(form.endAt);
  const nextStart = validDate(dueAt);
  const duration = previousStart && previousEnd && previousEnd > previousStart ? previousEnd.getTime() - previousStart.getTime() : null;
  return {
    ...form,
    dueAt,
    endAt: nextStart && duration ? localInput(new Date(nextStart.getTime() + duration)) : form.endAt,
  };
}

function isFinalAction(action: ActionItem) {
  return ["CLOSED", "CANCELLED"].includes(action.status || "OPEN");
}

function normalizeCalendarAction(action: ActionItem): CalendarAction | null {
  const start = validDate(action.dueAt);
  if (!action.id || !start) {
    const warningKey = action.id || "missing-id";
    if (process.env.NODE_ENV !== "production" && !warnedInvalidActionIds.has(warningKey)) {
      warnedInvalidActionIds.add(warningKey);
      console.warn("Skipping invalid CRM Action calendar event", warningKey);
    }
    return null;
  }
  const suppliedEnd = validDate(action.endAt);
  const end = suppliedEnd && suppliedEnd > start ? suppliedEnd : new Date(start.getTime() + 30 * 60_000);
  const type = action.type && typeNames[action.type] ? action.type : "TASK";
  const priority = action.priority && priorityNames[action.priority] ? action.priority : "NORMAL";
  const status = action.status || "OPEN";
  return {
    id: action.id,
    title: `${typeNames[type]}: ${personName(action.client)} — ${String(action.title || "Действие")}`,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: Boolean(action.allDay),
    editable: !isFinalAction(action),
    color: status === "CLOSED" ? "#94a3b8" : priority === "URGENT" ? "#dc2626" : priority === "HIGH" ? "#d97706" : "#047857",
    source: action,
  };
}

export default function ActionsWorkspace({ clients, managers, reload, openClient }: Props) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("list");
  const [mode, setMode] = useState<Mode>("day");
  const [section, setSection] = useState<Section>("today");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [manager, setManager] = useState("all");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const [selected, setSelected] = useState<ActionItem | null>(null);
  const [complete, setComplete] = useState<ActionItem | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [actionPatches, setActionPatches] = useState<Record<string, Partial<ActionItem>>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode") as Mode | null;
    const requestedSection = params.get("status") as Section | null;
    setView(params.get("view") === "calendar" ? "calendar" : "list");
    setMode(requestedMode && validModes.has(requestedMode) ? requestedMode : "day");
    setSection(requestedSection && validSections.has(requestedSection) ? requestedSection : "today");
    setDate(safeUrlDate(params.get("date")));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "actions");
    url.searchParams.set("view", view);
    if (view === "calendar") {
      url.searchParams.set("mode", mode);
      url.searchParams.set("date", date || todayValue());
    } else {
      url.searchParams.delete("mode");
      url.searchParams.delete("date");
    }
    if (section === "all") url.searchParams.delete("status");
    else url.searchParams.set("status", section);
    window.history.replaceState(null, "", url);
  }, [mounted, view, mode, date, section]);

  useEffect(() => {
    if (!selected?.id) return;
    let active = true;
    fetch(`/api/admin/client-actions?actionId=${encodeURIComponent(selected.id)}`)
      .then(async (response) => {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) throw new Error("Unexpected history response");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "History request failed");
        return data;
      })
      .then((data) => { if (active) setHistory(Array.isArray(data?.history) ? data.history : []); })
      .catch(() => { if (active) setHistory([]); });
    return () => { active = false; };
  }, [selected]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3_500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    setActionPatches({});
  }, [clients]);

  const actions = useMemo(() => clients.flatMap((client) => {
    const clientActions = Array.isArray(client.clientActions) ? client.clientActions : [];
    return clientActions.map((action) => {
      const patch = actionPatches[action.id];
      if (!patch) return { ...action, client };
      const managerId = patch.managerId !== undefined ? patch.managerId : action.manager?.id || action.managerId;
      return { ...action, ...patch, client, manager: managers.find((item) => item.id === managerId) || null };
    });
  }), [actionPatches, clients, managers]);

  useEffect(() => {
    if (!selected) return;
    const current = actions.find((action) => action.id === selected.id);
    if (current && current !== selected) setSelected(current);
  }, [actions, selected]);

  const currentTime = Date.now();
  const today = new Date().toDateString();
  const active = (action: ActionItem) => !isFinalAction(action);
  const timestamp = (action: ActionItem) => validDate(action.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  const stats = {
    today: actions.filter((action) => validDate(action.dueAt)?.toDateString() === today && active(action)).length,
    overdue: actions.filter((action) => timestamp(action) < currentTime && active(action)).length,
    week: actions.filter((action) => timestamp(action) >= currentTime && timestamp(action) <= currentTime + 7 * 86_400_000 && active(action)).length,
    completed: actions.filter((action) => action.status === "CLOSED" && validDate(action.dueAt)?.toDateString() === today).length,
  };

  const filtered = actions.filter((action) => {
    const due = validDate(action.dueAt);
    const actionTime = due?.getTime() ?? Number.POSITIVE_INFINITY;
    const q = search.trim().toLowerCase();
    const sectionMatch = section === "all" || (section === "today" && due?.toDateString() === today) || (section === "overdue" && actionTime < currentTime && active(action)) || (section === "upcoming" && actionTime >= currentTime && active(action)) || (section === "completed" && action.status === "CLOSED");
    const text = `${personName(action.client)} ${action.client?.email || ""} ${action.client?.phone || ""} ${action.title || ""} ${action.description || ""}`.toLowerCase();
    return sectionMatch && (manager === "all" || action.manager?.id === manager) && (type === "all" || action.type === type) && (priority === "all" || action.priority === priority) && text.includes(q);
  });

  const calendarEvents = useMemo(() => filtered.map(normalizeCalendarAction).filter((event): event is CalendarAction => event !== null), [filtered]);

  async function request(method: "POST" | "PATCH", body: object, messages?: { success?: string; error?: string }) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/client-actions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Сервер вернул некорректный ответ");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Ошибка сохранения");
      if (method === "PATCH" && data?.action?.id) {
        setActionPatches((current) => ({ ...current, [data.action.id]: data.action }));
      }
      if (messages?.success) setNotice({ kind: "success", text: messages.success });
      await reload();
      return data;
    } catch (reason) {
      const message = messages?.error || (reason instanceof Error ? reason.message : "Ошибка сохранения");
      setError(message);
      if (messages?.error) setNotice({ kind: "error", text: messages.error });
      throw reason;
    } finally { setBusy(false); }
  }

  const patchAction = (id: string, payload: object, notify = false) => request(
    "PATCH",
    { actionId: id, ...payload },
    notify ? { success: "Действие обновлено", error: "Не удалось обновить действие" } : undefined,
  );

  async function createAction(event: React.FormEvent) {
    event.preventDefault();
    const start = validDate(form.dueAt); const end = validDate(form.endAt);
    if (!start) return setError("Укажите корректную дату начала");
    if (end && end <= start) return setError("Окончание должно быть позже начала");
    try {
      await request("POST", { ...form, dueAt: start.toISOString(), endAt: end?.toISOString() || null });
      setCreateOpen(false); setForm(emptyForm());
    } catch { /* Error is rendered above the workspace. */ }
  }

  async function saveEditedAction() {
    if (!editing || isFinalAction(editing)) return;
    const start = validDate(form.dueAt); const end = validDate(form.endAt);
    if (!start) return setError("Укажите корректную дату начала");
    if (end && end <= start) return setError("Окончание должно быть позже начала");
    try {
      await patchAction(editing.id, {
        type: form.type,
        title: form.title,
        description: form.description,
        dueAt: start.toISOString(),
        endAt: end?.toISOString() || null,
        allDay: form.allDay,
        priority: form.priority,
        reminderMinutes: form.reminderMinutes,
        managerId: form.managerId,
      }, true);
      setEditing(null);
      setForm(emptyForm());
    } catch { /* The workspace and toast show the update error. */ }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setCreateOpen(true);
  }

  function openEdit(action: ActionItem) {
    if (isFinalAction(action)) return;
    setError("");
    setCreateOpen(false);
    setForm(formFromAction(action));
    setEditing(action);
  }

  function quickCreate(start: Date, end?: Date) {
    if (!validDate(start)) return;
    setForm({ ...emptyForm(), dueAt: localInput(start), endAt: localInput(end && end > start ? end : new Date(start.getTime() + 1_800_000)) });
    setEditing(null);
    setCreateOpen(true);
  }

  function updateVisibleCalendarDate(visibleDate: string) {
    if (!mounted || !/^\d{4}-\d{2}-\d{2}$/.test(visibleDate)) return;
    const url = new URL(window.location.href);
    url.searchParams.set("date", visibleDate);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="actions-workspace space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-950">Действия</h1><p className="mt-1 text-sm text-slate-500">Управление контактами, задачами и следующими действиями по клиентам.</p></div>
        <button onClick={openCreate} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">+ Создать действие</button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Сегодня", stats.today, "today"], ["Просрочено", stats.overdue, "overdue"], ["На этой неделе", stats.week, "upcoming"], ["Выполнено сегодня", stats.completed, "completed"]].map(([label, value, key]) => (
          <button key={String(key)} onClick={() => setSection(key as Section)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-300"><span className="text-xs font-medium text-slate-500">{label}</span><b className={`mt-1 block text-2xl ${key === "overdue" && Number(value) ? "text-red-600" : "text-slate-900"}`}>{value}</b></button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {(["list", "calendar"] as View[]).map((key) => <button key={key} onClick={() => setView(key)} className={`rounded-md px-4 py-2 text-sm font-semibold ${view === key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>{key === "list" ? "Список" : "Календарь"}</button>)}
          </div>
          {view === "calendar" && <div className="flex rounded-lg border border-slate-200 p-1">{(["day", "week", "month"] as Mode[]).map((key) => <button key={key} onClick={() => setMode(key)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === key ? "bg-slate-900 text-white" : "text-slate-500"}`}>{key === "day" ? "Сегодня" : key === "week" ? "Неделя" : "Месяц"}</button>)}</div>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{([['all','Все'],['today','Сегодня'],['overdue','Просроченные'],['upcoming','Предстоящие'],['completed','Выполненные']] as [Section,string][]).map(([key,label]) => <button key={key} onClick={() => setSection(key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${section === key ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по клиенту или действию..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm xl:col-span-2" />
          <select value={manager} onChange={(event) => setManager(event.target.value)} className="rounded-lg border-slate-200 text-sm"><option value="all">Все ответственные</option>{managers.map((item) => <option key={item.id} value={item.id}>{personName(item)}</option>)}</select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border-slate-200 text-sm"><option value="all">Все типы</option>{actionTypes.map((item) => <option key={item} value={item}>{typeNames[item]}</option>)}</select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border-slate-200 text-sm"><option value="all">Любой приоритет</option>{Object.entries(priorityNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
      </div>

      {selectedIds.size > 0 && <div className="sticky top-16 z-20 flex gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><b>{selectedIds.size} выбрано</b><button onClick={() => void Promise.all([...selectedIds].map((id) => patchAction(id, { status: "CLOSED", outcome: "OTHER" })))} className="rounded bg-emerald-600 px-3 py-1.5">Завершить</button><button onClick={() => void Promise.all([...selectedIds].map((id) => patchAction(id, { status: "CANCELLED" })))} className="rounded bg-slate-700 px-3 py-1.5">Отменить</button></div>}

      {view === "list" ? (
        <ActionsTable actions={filtered} selectedIds={selectedIds} setSelectedIds={setSelectedIds} editingId={editing?.id || null} form={form} setForm={setForm} busy={busy} onOpen={setSelected} onEdit={openEdit} onSave={saveEditedAction} onCancelEdit={() => { setEditing(null); setForm(emptyForm()); }} onComplete={setComplete} openClient={openClient} managers={managers} />
      ) : !mounted || !date ? <CalendarSkeleton /> : (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <ActionsCalendar
            mode={mode}
            date={date}
            events={calendarEvents}
            onDateChange={updateVisibleCalendarDate}
            onEventClick={(source) => setSelected(source as ActionItem)}
            onSlotClick={quickCreate}
            onMonthDayClick={(selectedDate) => { setDate(safeUrlDate(selectedDate)); setMode("day"); }}
            onMove={async (id, start, end) => { await patchAction(id, { dueAt: start.toISOString(), endAt: end?.toISOString() || null }, true); }}
            onCalendarError={(calendarError) => setError(`Ошибка календаря: ${calendarError.message}`)}
            onBackToList={() => setView("list")}
          />
        </div>
      )}

      {createOpen && <CreateActionModal form={form} setForm={setForm} clients={clients} managers={managers} busy={busy} close={() => { setCreateOpen(false); setForm(emptyForm()); }} submit={createAction} />}
      {selected && <ActionDrawer action={selected} history={history} close={() => setSelected(null)} openClient={openClient} edit={() => { setSelected(null); setView("list"); openEdit(selected); }} complete={() => setComplete(selected)} cancel={async () => { try { await patchAction(selected.id, { status: "CANCELLED" }); setSelected(null); } catch {} }} />}
      {complete && <CompleteModal action={complete} managers={managers} busy={busy} close={() => setComplete(null)} save={async (payload) => { try { await patchAction(complete.id, payload); setComplete(null); setSelected(null); } catch {} }} />}
      {notice && <div role={notice.kind === "error" ? "alert" : "status"} className={`fixed bottom-5 right-5 z-[120] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${notice.kind === "success" ? "bg-emerald-700" : "bg-red-700"}`}>{notice.text}</div>}
    </div>
  );
}

function CalendarSkeleton() { return <div className="min-h-[560px] animate-pulse rounded-xl border border-slate-200 bg-white p-4"><div className="mx-auto h-7 w-48 rounded bg-slate-100" /><div className="mt-5 grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, index) => <div key={index} className="h-20 rounded bg-slate-50" />)}</div></div>; }

function ActionsTable({ actions, selectedIds, setSelectedIds, editingId, form, setForm, busy, onOpen, onEdit, onSave, onCancelEdit, onComplete, openClient, managers }: { actions: ActionItem[]; selectedIds: Set<string>; setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>; editingId: string | null; form: ActionForm; setForm: React.Dispatch<React.SetStateAction<ActionForm>>; busy: boolean; onOpen: (action: ActionItem) => void; onEdit: (action: ActionItem) => void; onSave: () => Promise<void>; onCancelEdit: () => void; onComplete: (action: ActionItem) => void; openClient: (id: string) => void; managers: Person[] }) {
  const now = Date.now();
  return <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[1180px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr>{["", "Время", "Статус", "Тип", "Клиент", "Действие", "Ответственный", "Приоритет", "Напоминание", "Outcome", ""].map((heading, index) => <th key={index} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody>{[...actions].sort((left,right) => (validDate(left.dueAt)?.getTime() ?? Infinity) - (validDate(right.dueAt)?.getTime() ?? Infinity)).map((action) => {
    const due = validDate(action.dueAt); const overdue = Boolean(due && due.getTime() < now && !["CLOSED","CANCELLED"].includes(action.status || "OPEN"));
    const final = isFinalAction(action);
    if (editingId === action.id) return <InlineActionRow key={action.id} action={action} form={form} setForm={setForm} managers={managers} busy={busy} onSave={onSave} onCancel={onCancelEdit} />;
    return <tr key={action.id} className={`group border-t border-slate-100 ${final ? "opacity-55" : ""} ${overdue ? "border-l-2 border-l-red-500" : ""}`}><td className="px-3"><input type="checkbox" checked={selectedIds.has(action.id)} onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(action.id)) next.delete(action.id); else next.add(action.id); return next; })} /></td><td className={`whitespace-nowrap px-3 py-3 font-semibold ${overdue ? "text-red-600" : ""}`}>{due ? <>{due.toLocaleDateString("ru", { day: "2-digit", month: "short" })}<br />{due.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</> : "Дата не указана"}</td><td className="px-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{overdue ? "Просрочено" : statusNames[action.status || "OPEN"] || "Запланировано"}</span></td><td className="px-3">{typeNames[action.type || "TASK"] || typeNames.TASK}</td><td className="px-3">{action.client ? <button onClick={() => openClient(action.client!.id)} className="text-left font-semibold text-emerald-700 hover:underline">{personName(action.client)}</button> : <span>Клиент недоступен</span>}<small className="block text-slate-400">{action.client?.email || ""}</small></td><td className="max-w-xs px-3"><button onClick={() => onOpen(action)} className="text-left font-semibold hover:text-emerald-700">{action.title || "Действие"}</button><small className="block truncate text-slate-400">{action.description || ""}</small></td><td className="px-3">{action.manager ? personName(action.manager) : "Не назначен"}</td><td className="px-3">{priorityNames[action.priority || "NORMAL"] || priorityNames.NORMAL}</td><td className="px-3 text-xs">{action.reminderMinutes == null ? "Нет" : `за ${action.reminderMinutes} мин.`}</td><td className="px-3 text-xs">{action.outcome || "—"}</td><td className="px-3"><div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">{!final && <><button onClick={() => onComplete(action)} title="Завершить" className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">✓</button><button onClick={() => onEdit(action)} title="Редактировать" aria-label={`Редактировать: ${action.title || "Действие"}`} className="rounded bg-blue-50 px-2 py-1 text-blue-700">✎</button></>}<button onClick={() => onOpen(action)} title="Открыть" className="rounded bg-slate-100 px-2 py-1">•••</button></div></td></tr>;
  })}{actions.length === 0 && <tr><td colSpan={11} className="p-12 text-center text-slate-500">На выбранный период действий нет.</td></tr>}</tbody></table></div>;
}

function InlineActionRow({ action, form, setForm, managers, busy, onSave, onCancel }: { action: ActionItem; form: ActionForm; setForm: React.Dispatch<React.SetStateAction<ActionForm>>; managers: Person[]; busy: boolean; onSave: () => Promise<void>; onCancel: () => void }) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "checkbox") {
      event.preventDefault();
      void onSave();
    }
  }

  const inputClass = "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  return <tr className="border-y border-emerald-200 bg-emerald-50/40 align-top" onKeyDown={handleKeyDown}>
    <td className="px-3 py-3"><input type="checkbox" checked={false} disabled aria-label="Выбор недоступен во время редактирования" /></td>
    <td className="min-w-40 space-y-1 px-2 py-2">
      <input aria-label="Дата действия" type="date" value={form.dueAt.slice(0, 10)} onChange={(event) => { const value = event.target.value; setForm((current) => moveActionStart(current, replaceLocalDatePart(current.dueAt, value))); }} className={`${inputClass} w-full`} />
      <input aria-label="Время действия" type="time" value={form.dueAt.slice(11, 16)} onChange={(event) => { const value = event.target.value; setForm((current) => moveActionStart(current, replaceLocalTimePart(current.dueAt, value))); }} className={`${inputClass} w-full`} />
    </td>
    <td className="px-2 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{statusNames[action.status || "OPEN"] || statusNames.OPEN}</span></td>
    <td className="min-w-32 px-2 py-2"><select aria-label="Тип действия" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className={`${inputClass} w-full`}>{actionTypes.map((item) => <option key={item} value={item}>{typeNames[item]}</option>)}</select></td>
    <td className="min-w-40 px-2 py-3"><b>{personName(action.client)}</b><small className="block max-w-40 truncate text-slate-400">{action.client?.email || ""}</small></td>
    <td className="min-w-64 space-y-1 px-2 py-2">
      <input aria-label="Название действия" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={`${inputClass} w-full font-semibold`} />
      <textarea aria-label="Описание действия" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={2} className={`${inputClass} max-h-24 min-h-14 w-full resize-y`} />
    </td>
    <td className="min-w-40 px-2 py-2"><select aria-label="Ответственный менеджер" value={form.managerId} onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))} className={`${inputClass} w-full`}><option value="">Не назначен</option>{managers.map((item) => <option key={item.id} value={item.id}>{personName(item)}</option>)}</select></td>
    <td className="min-w-28 px-2 py-2"><select aria-label="Приоритет" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={`${inputClass} w-full`}>{Object.entries(priorityNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></td>
    <td className="min-w-32 px-2 py-2"><select aria-label="Напоминание" value={form.reminderMinutes} onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: event.target.value }))} className={`${inputClass} w-full`}><option value="">Нет</option>{[0,5,15,30,60,120,1440].map((value) => <option key={value} value={value}>{value === 0 ? "В момент" : value < 60 ? `За ${value} мин.` : `За ${value / 60} ч.`}</option>)}</select></td>
    <td className="px-2 py-3 text-xs">{action.outcome || "—"}</td>
    <td className="min-w-36 px-2 py-2"><div className="flex flex-col gap-1"><button type="button" disabled={busy} onClick={() => void onSave()} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Сохранить</button><button type="button" disabled={busy} onClick={onCancel} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">Отмена</button></div></td>
  </tr>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && close()}><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><h2 className="text-lg font-bold">{title}</h2><button onClick={close} aria-label="Закрыть" className="rounded-lg p-2 hover:bg-slate-100">✕</button></div><div className="p-5">{children}</div></div></div>; }
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`text-xs font-semibold text-slate-600 ${wide ? "sm:col-span-2" : ""}`}>{label}<div className="mt-1 [&_input]:w-full [&_input]:rounded-lg [&_input]:border-slate-200 [&_select]:w-full [&_select]:rounded-lg [&_select]:border-slate-200 [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border-slate-200">{children}</div></label>; }
function Block({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</h3><div className="space-y-1">{children}</div></section>; }

function CreateActionModal({ form, setForm, clients, managers, busy, close, submit }: { form: ActionForm; setForm: React.Dispatch<React.SetStateAction<ActionForm>>; clients: Client[]; managers: Person[]; busy: boolean; close: () => void; submit: (event: React.FormEvent) => void }) {
  return <Modal title="Создать действие" close={close}><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field label="Клиент *"><select required value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}><option value="">Выберите клиента</option>{clients.map((client) => <option key={client.id} value={client.id}>{personName(client)} · {client.email}</option>)}</select></Field><Field label="Тип *"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{actionTypes.map((item) => <option key={item} value={item}>{typeNames[item]}</option>)}</select></Field><Field label="Название *" wide><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Описание" wide><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Начало *"><input required type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></Field><Field label="Окончание"><input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></Field><Field label="Ответственный"><select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}><option value="">Не назначен</option>{managers.map((item) => <option key={item.id} value={item.id}>{personName(item)}</option>)}</select></Field><Field label="Приоритет"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{Object.entries(priorityNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Напоминание"><select value={form.reminderMinutes} onChange={(event) => setForm({ ...form, reminderMinutes: event.target.value })}><option value="">Нет</option>{[0,5,15,30,60,120,1440].map((value) => <option key={value} value={value}>{value === 0 ? "В момент действия" : value < 60 ? `За ${value} минут` : `За ${value / 60} ч.`}</option>)}</select></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allDay} onChange={(event) => setForm({ ...form, allDay: event.target.checked })} /> Весь день</label><div className="col-span-full flex justify-end gap-2 pt-2"><button type="button" onClick={close} className="rounded-lg border px-4 py-2">Отмена</button><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Сохранить</button></div></form></Modal>;
}

function ActionDrawer({ action, history, close, openClient, edit, complete, cancel }: { action: ActionItem; history: History[]; close: () => void; openClient: (id: string) => void; edit: () => void; complete: () => void; cancel: () => Promise<void> }) {
  useEffect(() => { const handler = (event: KeyboardEvent) => event.key === "Escape" && close(); addEventListener("keydown", handler); return () => removeEventListener("keydown", handler); }, [close]);
  const due = validDate(action.dueAt); const end = validDate(action.endAt);
  const final = isFinalAction(action);
  return <div className="fixed inset-0 z-[95] bg-slate-950/30" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="ml-auto h-full w-full max-w-[500px] overflow-y-auto bg-white shadow-2xl"><div className="border-b p-5"><small className="text-emerald-700">{typeNames[action.type || "TASK"] || typeNames.TASK}</small><h2 className="mt-1 text-xl font-bold">{action.title || "Действие"}</h2><span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs">{statusNames[action.status || "OPEN"] || statusNames.OPEN}</span></div><div className="space-y-5 p-5 text-sm"><Block title="Клиент"><b>{personName(action.client)}</b><p>{action.client?.email}</p><p>{action.client?.phone}</p>{action.client && <button onClick={() => openClient(action.client!.id)} className="mt-2 font-semibold text-emerald-700">Открыть клиента →</button>}</Block><Block title="Время"><p>{due ? due.toLocaleString("ru") : "Дата не указана"}{end ? ` — ${end.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}` : ""}</p></Block><Block title="Ответственный"><p>{action.manager ? personName(action.manager) : "Не назначен"}</p></Block><Block title="Описание"><p className="whitespace-pre-wrap">{action.description || "—"}</p></Block><Block title="Outcome"><p>{action.outcome || "—"}</p><p>{action.outcomeNote}</p></Block><Block title="История">{history.map((item) => <div key={item.id} className="border-l-2 border-slate-200 py-1 pl-3"><b>{item.event.replaceAll("_", " ")}</b><small className="block text-slate-400">{validDate(item.createdAt)?.toLocaleString("ru") || "—"}</small></div>)}{history.length === 0 && <p className="text-slate-400">История пуста</p>}</Block></div><div className="sticky bottom-0 flex gap-2 border-t bg-white p-4">{final ? <p className="text-sm text-slate-500">Завершённое или отменённое действие нельзя редактировать.</p> : <><button onClick={edit} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700">Редактировать</button><button onClick={complete} className="flex-1 rounded-lg bg-emerald-700 py-2 font-semibold text-white">Завершить</button><button onClick={() => void cancel()} className="rounded-lg border px-3">Отменить</button></>}</div></aside></div>;
}

function CompleteModal({ action, managers, busy, close, save }: { action: ActionItem; managers: Person[]; busy: boolean; close: () => void; save: (payload: object) => Promise<void> }) {
  const [outcome,setOutcome] = useState("SUCCESSFUL"); const [note,setNote] = useState(""); const [next,setNext] = useState(true); const [title,setTitle] = useState("Follow-up"); const [due,setDue] = useState(() => localInput(new Date(Date.now() + 86_400_000))); const [manager,setManager] = useState(action.manager?.id || "");
  return <Modal title="Завершить действие" close={close}><div className="space-y-3"><Field label="Outcome *"><select value={outcome} onChange={(event) => setOutcome(event.target.value)}>{["SUCCESSFUL","NO_ANSWER","CALL_BACK","INTERESTED","NOT_INTERESTED","KYC_REQUESTED","KYC_COMPLETED","DEPOSIT_EXPECTED","CONVERTED","OTHER"].map((item) => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select></Field><Field label="Комментарий"><textarea value={note} onChange={(event) => setNote(event.target.value)} /></Field><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={next} onChange={(event) => setNext(event.target.checked)} /> Создать следующее действие</label>{next && <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><Field label="Название"><input value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label="Дата и время"><input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} /></Field><Field label="Ответственный"><select value={manager} onChange={(event) => setManager(event.target.value)}><option value="">Не назначен</option>{managers.map((item) => <option key={item.id} value={item.id}>{personName(item)}</option>)}</select></Field></div>}<div className="flex justify-end gap-2"><button onClick={close} className="rounded-lg border px-4 py-2">Отмена</button><button disabled={busy} onClick={() => { const nextDue = validDate(due); void save({ status: "CLOSED", outcome, outcomeNote: note, nextAction: next && nextDue ? { title, dueAt: nextDue.toISOString(), managerId: manager, type: "FOLLOW_UP", reminderMinutes: 15 } : null }); }} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Завершить</button></div></div></Modal>;
}
