"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ManualQuotesPanel from "@/components/admin/ManualQuotesPanel";

type ManagerRef = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type ClientNote = {
  id: string;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  manager?: ManagerRef | null;
};

type ClientAction = {
  id: string;
  title: string;
  description?: string | null;
  dueAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  manager?: ManagerRef | null;
};

type VerificationDocument = {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  status: string;
  createdAt: string;
  user?: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    managerId?: string | null;
  };
};

type SupportMessage = {
  id: string;
  userId: string;
  message: string;
  sender?: string | null;
  fromRole?: string | null;
  createdAt: string;
  user?: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  balance: number;
  role: string;
  isBlocked: boolean;
  kycStatus: string;
  managerId?: string | null;
  manager?: ManagerRef | null;
  createdAt: string;
  trades: unknown[];
  withdrawals: unknown[];
  verificationDocs?: VerificationDocument[];
  verificationDocuments?: VerificationDocument[];
  clientNotes?: ClientNote[];
  clientActions?: ClientAction[];
};

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  destination?: string | null;
  details?: string | null;
  status: string;
  createdAt: string;
  user: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    managerId?: string | null;
  };
};

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
  swap?: number | null;
  takeProfit?: number | null;
  stopLoss?: number | null;
  comment?: string | null;
  createdAt: string;
  user: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    managerId?: string | null;
  };
};

type Tab =
  | "desktop"
  | "clients"
  | "clientCard"
  | "actions"
  | "managers"
  | "trades"
  | "withdrawals"
  | "verification"
  | "support"
  | "quotes";

const tabs: { id: Tab; label: string; hint: string; icon: string }[] = [
  { id: "desktop", label: "Рабочий стол", hint: "сводка и задачи", icon: "▦" },
  { id: "clients", label: "Клиенты", hint: "база и менеджеры", icon: "◉" },
  { id: "clientCard", label: "Карточка клиента", hint: "профиль и журнал", icon: "▣" },
  { id: "actions", label: "Действия", hint: "звонки и задачи", icon: "◷" },
  { id: "managers", label: "Менеджеры", hint: "роли CRM", icon: "♟" },
  { id: "trades", label: "Сделки", hint: "позиции клиентов", icon: "↕" },
  { id: "withdrawals", label: "Выводы", hint: "финансовые заявки", icon: "⇅" },
  { id: "verification", label: "Верификация", hint: "KYC документы", icon: "✓" },
  { id: "support", label: "Поддержка", hint: "чат с клиентами", icon: "✉" },
  { id: "quotes", label: "Котировки", hint: "ручная настройка", icon: "⌁" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";
const areaClass =
  "min-h-24 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

export default function AsteroCrm() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("desktop");
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportText, setSupportText] = useState("");
  const [supportClientId, setSupportClientId] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [depositAmount, setDepositAmount] = useState("100");
  const [balanceAmount, setBalanceAmount] = useState("1000");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState("OPEN");
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    status: "OPEN",
    managerId: "",
  });
  const [newClient, setNewClient] = useState({
    email: "",
    password: "123456",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    balance: "0",
    managerId: "",
  });
  const [newManager, setNewManager] = useState({
    email: "",
    password: "123456",
    firstName: "",
    lastName: "",
    phone: "",
  });

  async function loadAdminData() {
    setLoading(true);
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    const data = await res.json();
    const supportRes = await fetch("/api/admin/support", { cache: "no-store" });
    const supportData = supportRes.ok ? await supportRes.json() : [];
    const role = localStorage.getItem("role");
    const currentUserId = localStorage.getItem("userId");

    if (!res.ok) {
      setMessage(data.error || "Не удалось загрузить CRM");
      setLoading(false);
      return;
    }

    const allUsers: User[] = data.users || [];
    const allClients: User[] =
      data.clients || allUsers.filter((user) => user.role !== "ADMIN" && user.role !== "MANAGER");
    const allManagers: User[] =
      data.managers || allUsers.filter((user) => user.role === "MANAGER" || user.role === "ADMIN");

    const visibleClients =
      role === "MANAGER" && currentUserId
        ? allClients.filter((client) => client.managerId === currentUserId)
        : allClients;

    setUsers(allUsers);
    setClients(visibleClients);
    setManagers(allManagers);
    setWithdrawals(
      role === "MANAGER" && currentUserId
        ? (data.withdrawals || []).filter((item: Withdrawal) => item.user.managerId === currentUserId)
        : data.withdrawals || []
    );
    setTrades(
      role === "MANAGER" && currentUserId
        ? (data.trades || []).filter((item: Trade) => item.user.managerId === currentUserId)
        : data.trades || []
    );
    const allVerificationDocs: VerificationDocument[] =
      data.verificationDocuments ||
      allUsers.flatMap((user) =>
        (user.verificationDocs || user.verificationDocuments || []).map((doc) => ({
          ...doc,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            managerId: user.managerId,
          },
        }))
      );

    setVerificationDocuments(
      role === "MANAGER" && currentUserId
        ? allVerificationDocs.filter((doc) => doc.user?.managerId === currentUserId)
        : allVerificationDocs
    );

    const visibleSupportMessages: SupportMessage[] =
      role === "MANAGER" && currentUserId
        ? (supportData || []).filter((item: SupportMessage) => {
            const client = allClients.find((client) => client.id === item.userId);
            return client?.managerId === currentUserId;
          })
        : supportData || [];

    setSupportMessages(visibleSupportMessages);
    setSupportClientId((prev) => prev || visibleSupportMessages[0]?.userId || visibleClients[0]?.id || "");
    setSelectedClientId((prev) => prev || visibleClients[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN" && role !== "MANAGER") {
      router.push("/");
      return;
    }
    setAllowed(true);
    loadAdminData();
  }, [router]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0],
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clients.filter((client) =>
      `${client.email} ${client.firstName || ""} ${client.lastName || ""} ${client.phone || ""} ${client.country || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [clients, clientSearch]);

  const allActions = clients.flatMap((client) =>
    (client.clientActions || []).map((action) => ({ ...action, client }))
  );
  const openActions = allActions.filter((action) => action.status !== "CLOSED");
  const overdueActions = openActions.filter((action) => new Date(action.dueAt).getTime() < Date.now());
  const pendingWithdrawals = withdrawals.filter((item) => item.status === "PENDING");
  const pendingKyc = verificationDocuments.filter((doc) => doc.status === "PENDING");
  const totalBalance = clients.reduce((sum, client) => sum + Number(client.balance || 0), 0);

  async function createUser(role: "CLIENT" | "MANAGER") {
    setMessage(role === "MANAGER" ? "Создаю менеджера..." : "Создаю клиента...");
    const payload = role === "MANAGER" ? { ...newManager, role } : { ...newClient, role };
    const res = await fetch("/api/admin/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Ошибка создания пользователя");
      return;
    }
    setMessage(role === "MANAGER" ? `Менеджер создан: ${data.email}` : `Клиент создан: ${data.email}`);
    setNewClient({ email: "", password: "123456", firstName: "", lastName: "", phone: "", country: "", city: "", address: "", balance: "0", managerId: "" });
    setNewManager({ email: "", password: "123456", firstName: "", lastName: "", phone: "" });
    await loadAdminData();
  }

  async function assignManager(userId: string, managerId: string) {
    const res = await fetch("/api/admin/users/assign-manager", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, managerId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Не удалось назначить менеджера");
    await loadAdminData();
  }

  async function depositToUser(userId: string) {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return alert("Введите корректную сумму");
    const res = await fetch("/api/admin/users/deposit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка депозита");
    await loadAdminData();
  }

  async function setUserBalance(userId: string) {
    const balance = Number(balanceAmount);
    if (Number.isNaN(balance) || balance < 0) return alert("Некорректный баланс");
    const res = await fetch("/api/admin/users/set-balance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, balance }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка баланса");
    await loadAdminData();
  }

  async function changeClientPassword(userId: string) {
    const password = passwords[userId];
    if (!password || password.length < 6) return alert("Пароль минимум 6 символов");
    const res = await fetch("/api/admin/users/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка смены пароля");
    setPasswords((prev) => ({ ...prev, [userId]: "" }));
    alert("Пароль изменён");
  }

  async function toggleBlockUser(userId: string, isBlocked: boolean) {
    const res = await fetch("/api/admin/users/block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBlocked: !isBlocked }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка блокировки");
    await loadAdminData();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Удалить пользователя ${email}?`)) return;
    const res = await fetch("/api/admin/users/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка удаления");
    await loadAdminData();
  }

  async function approveWithdrawal(withdrawalId: string) {
    const res = await fetch("/api/admin/withdrawals/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка подтверждения");
    await loadAdminData();
  }

  async function rejectWithdrawal(withdrawalId: string) {
    const res = await fetch("/api/admin/withdrawals/reject", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка отклонения");
    await loadAdminData();
  }

  async function closeClientTrade(trade: Trade) {
    const input = prompt(`Закрыть ${trade.symbol} ${trade.side}. Цена закрытия:`, String(trade.openPrice));
    if (!input) return;
    const closePrice = Number(input);
    if (!closePrice || Number.isNaN(closePrice)) return alert("Некорректная цена");
    const res = await fetch("/api/trade/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId: trade.id, closePrice }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка закрытия сделки");
    await loadAdminData();
  }

  async function reviewDocument(documentId: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, status }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка верификации");
    await loadAdminData();
  }

  async function addNote() {
    if (!selectedClient || !noteText.trim()) return;
    const res = await fetch("/api/admin/client-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClient.id,
        managerId: localStorage.getItem("userId"),
        text: noteText,
        status: noteStatus,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка заметки");
    setNoteText("");
    await loadAdminData();
  }

  async function updateNote(noteId: string, status: string) {
    const res = await fetch("/api/admin/client-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, status }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка статуса заметки");
    await loadAdminData();
  }

  async function addAction() {
    if (!selectedClient || !actionForm.title.trim() || !actionForm.dueAt) {
      return alert("Заполните действие и дату");
    }
    const res = await fetch("/api/admin/client-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClient.id,
        managerId: actionForm.managerId || localStorage.getItem("userId"),
        title: actionForm.title,
        description: actionForm.description,
        dueAt: actionForm.dueAt,
        status: actionForm.status,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка действия");
    setActionForm({ title: "", description: "", dueAt: "", status: "OPEN", managerId: "" });
    await loadAdminData();
  }

  async function updateAction(
    actionId: string,
    payload: Partial<{ status: string; dueAt: string; managerId: string }>
  ) {
    const res = await fetch("/api/admin/client-actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка действия");
    await loadAdminData();
  }

  async function sendSupportMessage() {
    if (!supportClientId || !supportText.trim()) {
      return alert("Выберите клиента и введите сообщение");
    }

    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: supportClientId, message: supportText }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.error || "Ошибка отправки сообщения");
    }

    setSupportText("");
    await loadAdminData();
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06130d] text-white">
        Проверка доступа...
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#06130d] text-white">
      <aside className="hidden w-80 shrink-0 border-r border-emerald-400/10 bg-[#07170f] p-4 lg:block">
        <div className="mb-4 rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.04] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Astero CRM</p>
          <h2 className="mt-2 text-2xl font-black">Панель менеджера</h2>
          <p className="mt-1 text-sm text-emerald-50/60">Клиенты, действия, сделки, финансы и верификация.</p>
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-white/[0.04] text-emerald-50 hover:bg-white/[0.08]"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-black">{tab.icon}</span>
              <span>
                <span className="block text-sm font-black">{tab.label}</span>
                <span className={`block text-xs ${activeTab === tab.id ? "text-slate-800" : "text-emerald-50/50"}`}>{tab.hint}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 space-y-4 p-3 sm:p-4 lg:p-6">
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-12 w-full items-center justify-between rounded-2xl border border-emerald-400/10 bg-[#07170f] px-4 text-sm font-black text-white"
          >
            <span>☰ {tabs.find((tab) => tab.id === activeTab)?.label}</span>
            <span className="text-emerald-300">{mobileMenuOpen ? "Закрыть" : "Меню"}</span>
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-emerald-400/10 bg-[#07170f] p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-3 py-3 text-left text-sm font-bold ${
                    activeTab === tab.id
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-white/[0.04] text-emerald-50"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-400/10 bg-white/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">CRM</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
              <p className="mt-1 text-sm text-emerald-50/60">Рабочая область администратора и менеджеров Astero.</p>
            </div>
            <button onClick={loadAdminData} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400">
              Обновить данные
            </button>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">{message}</div>}

        {activeTab === "desktop" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              <Metric title="Клиенты" value={loading ? "..." : clients.length} />
              <Metric title="Менеджеры" value={managers.length} />
              <Metric title="Баланс клиентов" value={`$${totalBalance.toFixed(2)}`} />
              <Metric title="Открытые действия" value={openActions.length} />
              <Metric title="Просрочено" value={overdueActions.length} danger={overdueActions.length > 0} />
              <Metric title="KYC pending" value={pendingKyc.length} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="Ближайшие действия">
                <ActionList actions={openActions.slice(0, 8)} managers={managers} onUpdate={updateAction} showClient />
              </Panel>
              <Panel title="Финансы и верификация">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MiniStat title="Заявки на вывод" value={pendingWithdrawals.length} />
                  <MiniStat title="Документы KYC" value={pendingKyc.length} />
                </div>
                <div className="mt-4 space-y-2">
                  {pendingWithdrawals.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-emerald-100 p-3 text-sm">
                      <b>{item.user.email}</b> — ${Number(item.amount).toFixed(2)} · {item.method}
                    </div>
                  ))}
                  {pendingWithdrawals.length === 0 && <Empty text="Нет срочных финансовых заявок" />}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="space-y-4">
            <Panel title="Создать клиента">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <input className={inputClass} placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                <input className={inputClass} placeholder="Пароль" type={showPasswords ? "text" : "password"} value={newClient.password} onChange={(e) => setNewClient({ ...newClient, password: e.target.value })} />
                <input className={inputClass} placeholder="Имя" value={newClient.firstName} onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })} />
                <input className={inputClass} placeholder="Фамилия" value={newClient.lastName} onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })} />
                <input className={inputClass} placeholder="Телефон" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
                <input className={inputClass} placeholder="Страна" value={newClient.country} onChange={(e) => setNewClient({ ...newClient, country: e.target.value })} />
                <input className={inputClass} placeholder="Город" value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} />
                <input className={inputClass} placeholder="Адрес" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} />
                <input className={inputClass} type="number" placeholder="Баланс" value={newClient.balance} onChange={(e) => setNewClient({ ...newClient, balance: e.target.value })} />
                <select className={inputClass} value={newClient.managerId} onChange={(e) => setNewClient({ ...newClient, managerId: e.target.value })}>
                  <option value="">Без менеджера</option>
                  {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="mt-3 rounded-xl border border-emerald-100 px-4 py-2 text-xs font-black text-emerald-700"
              >
                {showPasswords ? "Скрыть пароли" : "Показать пароли"}
              </button>
              <button onClick={() => createUser("CLIENT")} className="mt-4 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950">Создать клиента</button>
            </Panel>
            <Panel title="Клиентская база">
              <input className={`${inputClass} mb-4`} placeholder="Поиск: email, имя, телефон, страна" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {filteredClients.map((client) => (
                  <ClientListCard
                    key={client.id}
                    client={client}
                    managers={managers}
                    onAssign={assignManager}
                    onOpen={() => { setSelectedClientId(client.id); setActiveTab("clientCard"); }}
                    onBlock={() => toggleBlockUser(client.id, client.isBlocked)}
                    onDelete={() => deleteUser(client.id, client.email)}
                  />
                ))}
                {filteredClients.length === 0 && <Empty text="Клиенты не найдены" />}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "clientCard" && selectedClient && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
            <Panel title="Список клиентов">
              <input className={`${inputClass} mb-3`} placeholder="Поиск клиента" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              <div className="max-h-[690px] space-y-2 overflow-y-auto pr-1">
                {filteredClients.map((client) => <ClientRow key={client.id} client={client} active={client.id === selectedClient.id} onOpen={() => setSelectedClientId(client.id)} />)}
              </div>
            </Panel>
            <div className="space-y-4">
              <Panel title="Карточка клиента">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Info label="Клиент" value={displayName(selectedClient)} sub={selectedClient.email} />
                  <Info label="Телефон" value={selectedClient.phone || "-"} sub={`${selectedClient.country || "-"}, ${selectedClient.city || ""}`} />
                  <Info label="Баланс" value={`$${Number(selectedClient.balance).toFixed(2)}`} />
                  <Info label="Менеджер" value={selectedClient.manager ? displayName(selectedClient.manager) : "Не назначен"} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-100 p-3">
                    <label className="text-xs font-bold text-slate-500">Назначить менеджера</label>
                    <select className={`${inputClass} mt-2`} value={selectedClient.managerId || ""} onChange={(e) => assignManager(selectedClient.id, e.target.value)}>
                      <option value="">Без менеджера</option>
                      {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
                    </select>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 p-3">
                    <label className="text-xs font-bold text-slate-500">Депозит</label>
                    <div className="mt-2 flex gap-2">
                      <input className={inputClass} type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                      <button onClick={() => depositToUser(selectedClient.id)} className="rounded-xl bg-emerald-500 px-4 text-sm font-black text-slate-950">OK</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 p-3">
                    <label className="text-xs font-bold text-slate-500">Смена пароля</label>
                    <div className="mt-2 flex gap-2">
                      <input className={inputClass} value={passwords[selectedClient.id] || ""} onChange={(e) => setPasswords({ ...passwords, [selectedClient.id]: e.target.value })} placeholder="Новый пароль" type={showPasswords ? "text" : "password"} />
                      <button onClick={() => changeClientPassword(selectedClient.id)} className="rounded-xl bg-slate-900 px-4 text-sm font-black text-white">OK</button>
                    </div>
                  </div>
                </div>
              </Panel>

              <ClientTimeline
                client={selectedClient}
                withdrawals={withdrawals}
                trades={trades}
                documents={verificationDocuments}
              />

              <Panel title="Создать действие">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                  <input className={inputClass} placeholder="Название действия" value={actionForm.title} onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })} />
                  <input className={inputClass} type="datetime-local" value={actionForm.dueAt} onChange={(e) => setActionForm({ ...actionForm, dueAt: e.target.value })} />
                  <select className={inputClass} value={actionForm.status} onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}>
                    <option value="OPEN">Открыто</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="POSTPONED">Перенесено</option>
                    <option value="CLOSED">Закрыто</option>
                  </select>
                  <select className={inputClass} value={actionForm.managerId} onChange={(e) => setActionForm({ ...actionForm, managerId: e.target.value })}>
                    <option value="">Текущий менеджер</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
                  </select>
                  <button onClick={addAction} className="rounded-xl bg-emerald-500 px-4 text-sm font-black text-slate-950">Добавить</button>
                </div>
                <textarea className={`${areaClass} mt-3`} placeholder="Описание действия" value={actionForm.description} onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })} />
              </Panel>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Panel title="Действия клиента">
                  <ActionList actions={(selectedClient.clientActions || []).map((action) => ({ ...action, client: selectedClient }))} managers={managers} onUpdate={updateAction} />
                </Panel>
                <Panel title="Комментарии">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_auto]">
                    <textarea className={areaClass} placeholder="Комментарий по клиенту" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    <select className={inputClass} value={noteStatus} onChange={(e) => setNoteStatus(e.target.value)}>
                      <option value="OPEN">Открыто</option>
                      <option value="IMPORTANT">Важно</option>
                      <option value="CLOSED">Закрыто</option>
                    </select>
                    <button onClick={addNote} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">Добавить</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(selectedClient.clientNotes || []).map((note) => <NoteCard key={note.id} note={note} onStatus={updateNote} />)}
                    {(selectedClient.clientNotes || []).length === 0 && <Empty text="Комментариев пока нет" />}
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        )}

        {activeTab === "actions" && (
          <Panel title="Все действия">
            <ActionList actions={allActions} managers={managers} onUpdate={updateAction} showClient />
          </Panel>
        )}

        {activeTab === "managers" && (
          <div className="space-y-4">
            <Panel title="Создать менеджера">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <input className={inputClass} placeholder="Email" value={newManager.email} onChange={(e) => setNewManager({ ...newManager, email: e.target.value })} />
                <input className={inputClass} placeholder="Пароль" type={showPasswords ? "text" : "password"} value={newManager.password} onChange={(e) => setNewManager({ ...newManager, password: e.target.value })} />
                <input className={inputClass} placeholder="Имя" value={newManager.firstName} onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })} />
                <input className={inputClass} placeholder="Фамилия" value={newManager.lastName} onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })} />
                <input className={inputClass} placeholder="Телефон" value={newManager.phone} onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })} />
              </div>
              <button onClick={() => createUser("MANAGER")} className="mt-4 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950">Создать менеджера</button>
            </Panel>
            <Panel title="Команда CRM">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {managers.map((manager) => (
                  <div key={manager.id} className="rounded-2xl border border-emerald-100 p-4">
                    <p className="text-lg font-black">{displayName(manager)}</p>
                    <p className="text-sm text-slate-500">{manager.email}</p>
                    <p className="mt-3 text-2xl font-black text-emerald-600">{clients.filter((client) => client.managerId === manager.id).length}</p>
                    <p className="text-xs text-slate-500">закреплённых клиентов</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "trades" && <TradeTable trades={trades} onClose={closeClientTrade} />}
        {activeTab === "withdrawals" && <WithdrawalsTable withdrawals={withdrawals} onApprove={approveWithdrawal} onReject={rejectWithdrawal} />}
        {activeTab === "verification" && <KycTable documents={verificationDocuments} onReview={reviewDocument} />}
        {activeTab === "support" && (
          <SupportPanel
            clients={clients}
            messages={supportMessages}
            selectedClientId={supportClientId}
            setSelectedClientId={setSupportClientId}
            text={supportText}
            setText={setSupportText}
            onSend={sendSupportMessage}
          />
        )}
        {activeTab === "quotes" && <ManualQuotesPanel />}
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 text-slate-950 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] dark:text-white sm:p-5"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>;
}

function Metric({ title, value, danger }: { title: string; value: string | number; danger?: boolean }) {
  return <div className="rounded-[1.5rem] border border-emerald-400/10 bg-white p-4 text-slate-950 shadow-sm dark:bg-white/[0.04] dark:text-white"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-emerald-50/50">{title}</p><p className={`mt-2 text-2xl font-black sm:text-3xl ${danger ? "text-red-500" : "text-emerald-600"}`}>{value}</p></div>;
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return <div className="rounded-2xl border border-emerald-100 p-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-black text-emerald-600">{value}</p></div>;
}

function Badge({ value }: { value: string }) {
  const cls = value === "APPROVED" || value === "ACTIVE" || value === "CLOSED"
    ? "bg-emerald-50 text-emerald-700"
    : value === "REJECTED" || value === "BLOCKED"
      ? "bg-red-50 text-red-700"
      : value === "POSTPONED"
        ? "bg-blue-50 text-blue-700"
        : "bg-yellow-50 text-yellow-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}

function displayName(user: { email?: string; firstName?: string | null; lastName?: string | null }) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "-";
}

function ClientRow({ client, onOpen, active }: { client: User; onOpen: () => void; active?: boolean }) {
  return <button onClick={onOpen} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-emerald-500 bg-emerald-50" : "border-emerald-100 bg-white hover:bg-emerald-50"}`}><p className="font-black text-slate-950">{displayName(client)}</p><p className="text-xs text-slate-500">{client.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge value={client.kycStatus} /><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></div></button>;
}

function ClientListCard({ client, managers, onAssign, onOpen, onBlock, onDelete }: { client: User; managers: User[]; onAssign: (userId: string, managerId: string) => void; onOpen: () => void; onBlock: () => void; onDelete: () => void }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-black text-slate-950">{displayName(client)}</p><p className="text-sm text-slate-500">{client.email}</p><p className="mt-1 text-xs text-slate-500">{client.phone || "-"} · {client.country || "-"}</p></div><div className="flex flex-wrap gap-2"><Badge value={client.kycStatus} /><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></div></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><select className={inputClass} value={client.managerId || ""} onChange={(e) => onAssign(client.id, e.target.value)}><option value="">Не назначен</option>{managers.map((m) => <option key={m.id} value={m.id}>{displayName(m)}</option>)}</select><p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">${Number(client.balance).toFixed(2)}</p></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={onOpen} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Открыть карточку</button><button onClick={onBlock} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white">{client.isBlocked ? "Разблокировать" : "Заблокировать"}</button><button onClick={onDelete} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white">Удалить</button></div></div>;
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl border border-emerald-100 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>;
}

function NoteCard({ note, onStatus }: { note: ClientNote; onStatus: (id: string, status: string) => void }) {
  return <div className="rounded-2xl border border-emerald-100 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm text-slate-700 dark:text-slate-200">{note.text}</p><Badge value={note.status} /></div><div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500"><span>{new Date(note.createdAt).toLocaleString()}</span><select className="rounded-lg border border-emerald-100 px-2 py-1" value={note.status} onChange={(e) => onStatus(note.id, e.target.value)}><option value="OPEN">Открыто</option><option value="IMPORTANT">Важно</option><option value="CLOSED">Закрыто</option></select></div></div>;
}

function ActionList({ actions, onUpdate, managers, showClient }: { actions: (ClientAction & { client?: User })[]; onUpdate: (id: string, payload: Partial<{ status: string; dueAt: string; managerId: string }>) => void; managers: User[]; showClient?: boolean }) {
  return <div className="space-y-3">{actions.map((action) => <div key={action.id} className="rounded-2xl border border-emerald-100 p-4"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-black">{action.title}</p>{showClient && action.client && <p className="text-xs text-slate-500">{displayName(action.client)} · {action.client.email}</p>}<p className="mt-1 text-sm text-slate-500">{action.description || "Без описания"}</p></div><Badge value={action.status} /></div><div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4"><input type="datetime-local" className={inputClass} defaultValue={toLocalDateTime(action.dueAt)} onBlur={(e) => e.target.value && onUpdate(action.id, { dueAt: e.target.value })} /><select className={inputClass} value={action.status} onChange={(e) => onUpdate(action.id, { status: e.target.value })}><option value="OPEN">Открыто</option><option value="IN_PROGRESS">В работе</option><option value="POSTPONED">Перенесено</option><option value="CLOSED">Закрыто</option></select><select className={inputClass} value={action.manager?.id || ""} onChange={(e) => onUpdate(action.id, { managerId: e.target.value })}><option value="">Без менеджера</option>{managers.map((m) => <option key={m.id} value={m.id}>{displayName(m)}</option>)}</select><button onClick={() => onUpdate(action.id, { status: "CLOSED" })} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Закрыть</button></div><p className="mt-2 text-xs text-slate-500">Срок: {new Date(action.dueAt).toLocaleString()}</p></div>)}{actions.length === 0 && <Empty text="Действий нет" />}</div>;
}


function SupportPanel({
  clients,
  messages,
  selectedClientId,
  setSelectedClientId,
  text,
  setText,
  onSend,
}: {
  clients: User[];
  messages: SupportMessage[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  text: string;
  setText: (text: string) => void;
  onSend: () => void;
}) {
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const dialog = messages
    .filter((message) => message.userId === selectedClientId)
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const clientsWithMessages = clients
    .map((client) => ({
      client,
      count: messages.filter((message) => message.userId === client.id).length,
      last: messages
        .filter((message) => message.userId === client.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    }))
    .sort((a, b) => new Date(b.last?.createdAt || 0).getTime() - new Date(a.last?.createdAt || 0).getTime());

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <Panel title="Диалоги поддержки">
        <div className="space-y-2">
          {clientsWithMessages.map(({ client, count, last }) => (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selectedClientId === client.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-emerald-100 bg-white hover:bg-emerald-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-black text-slate-950">{displayName(client)}</p>
                  <p className="text-xs text-slate-500">{client.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                  {count}
                </span>
              </div>
              <p className="mt-2 truncate text-xs text-slate-500">
                {last?.message || "Сообщений пока нет"}
              </p>
            </button>
          ))}

          {clientsWithMessages.length === 0 && <Empty text="Клиентов пока нет" />}
        </div>
      </Panel>

      <Panel title={selectedClient ? `Чат: ${displayName(selectedClient)}` : "Чат поддержки"}>
        {!selectedClient ? (
          <Empty text="Выберите клиента слева" />
        ) : (
          <div className="flex min-h-[560px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-emerald-100 bg-slate-50 p-3">
              {dialog.map((message) => {
                const isAdmin = message.sender === "ADMIN" || message.fromRole === "ADMIN";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        isAdmin
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`mt-2 text-[11px] ${isAdmin ? "text-emerald-50/70" : "text-slate-400"}`}>
                        {isAdmin ? "Администратор" : "Клиент"} · {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {dialog.length === 0 && <Empty text="История чата пуста" />}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
              <textarea
                className={areaClass}
                placeholder="Ответ клиенту..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                onClick={onSend}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function ClientTimeline({
  client,
  withdrawals,
  trades,
  documents,
}: {
  client: User;
  withdrawals: Withdrawal[];
  trades: Trade[];
  documents: VerificationDocument[];
}) {
  const events = [
    {
      id: `created-${client.id}`,
      date: client.createdAt,
      title: "Регистрация клиента",
      text: client.email,
      tone: "bg-emerald-50 text-emerald-700",
    },
    ...withdrawals
      .filter((item) => item.user?.id === client.id || item.user?.email === client.email)
      .map((item) => ({
        id: `withdrawal-${item.id}`,
        date: item.createdAt,
        title: `Вывод средств: $${Number(item.amount).toFixed(2)}`,
        text: `${withdrawalMethodLabel(item.method)} · ${item.status}`,
        tone: "bg-yellow-50 text-yellow-700",
      })),
    ...trades
      .filter((item) => item.user?.id === client.id || item.user?.email === client.email)
      .map((item) => ({
        id: `trade-${item.id}`,
        date: item.createdAt,
        title: `${item.side} ${item.symbol}`,
        text: `Объём ${item.volume} · Open ${item.openPrice} · TP ${item.takeProfit ?? "-"} · SL ${item.stopLoss ?? "-"}`,
        tone: item.side === "BUY" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
      })),
    ...(client.clientNotes || []).map((note) => ({
      id: `note-${note.id}`,
      date: note.createdAt,
      title: `Комментарий: ${note.status}`,
      text: note.text,
      tone: "bg-blue-50 text-blue-700",
    })),
    ...(client.clientActions || []).map((action) => ({
      id: `action-${action.id}`,
      date: action.createdAt,
      title: `Действие: ${action.title}`,
      text: `${action.status} · срок ${action.dueAt ? new Date(action.dueAt).toLocaleString("ru-RU") : "-"}`,
      tone: "bg-slate-100 text-slate-700",
    })),
    ...documents
      .filter((doc) => doc.user?.id === client.id || doc.user?.email === client.email)
      .map((doc) => ({
        id: `doc-${doc.id}`,
        date: doc.createdAt,
        title: `Документ: ${doc.documentType || "DOCUMENT"}`,
        text: `${doc.fileName} · ${doc.status}`,
        tone: "bg-purple-50 text-purple-700",
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Panel title="Timeline клиента">
      <div className="space-y-3">
        {events.slice(0, 12).map((event) => (
          <div key={event.id} className="flex gap-3 rounded-2xl border border-emerald-100 bg-white p-3">
            <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${event.tone.split(" ")[0]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-black text-slate-950">{event.title}</p>
                <span className="text-xs text-slate-400">{new Date(event.date).toLocaleString("ru-RU")}</span>
              </div>
              <p className="mt-1 break-words text-sm text-slate-500">{event.text}</p>
            </div>
          </div>
        ))}

        {events.length === 0 && <Empty text="Событий пока нет" />}
      </div>
    </Panel>
  );
}

function TradeTable({ trades, onClose }: { trades: Trade[]; onClose: (trade: Trade) => void }) {
  return (
    <Panel title="Сделки клиентов">
      <div className="overflow-x-auto">
        <table className="min-w-[1250px] w-full text-sm">
          <thead>
            <tr className="border-b border-emerald-100 text-left text-slate-500">
              <th className="p-3">Клиент</th>
              <th className="p-3">Символ</th>
              <th className="p-3">Сторона</th>
              <th className="p-3">Объём</th>
              <th className="p-3">Open</th>
              <th className="p-3">TP</th>
              <th className="p-3">SL</th>
              <th className="p-3">Swap</th>
              <th className="p-3">Profit</th>
              <th className="p-3">Комментарий</th>
              <th className="p-3">Действие</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-emerald-50">
                <td className="p-3">{trade.user.email}</td>
                <td className="p-3 font-bold">{trade.symbol}</td>
                <td className={`p-3 font-bold ${trade.side === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{trade.side}</td>
                <td className="p-3">{trade.volume}</td>
                <td className="p-3">{trade.openPrice}</td>
                <td className="p-3">{trade.takeProfit ?? "-"}</td>
                <td className="p-3">{trade.stopLoss ?? "-"}</td>
                <td className="p-3">{trade.swap ?? 0}</td>
                <td className="p-3">{trade.profit === null ? "-" : `$${Number(trade.profit).toFixed(2)}`}</td>
                <td className="max-w-[220px] truncate p-3 text-slate-500">{trade.comment || "-"}</td>
                <td className="p-3">
                  {trade.closePrice === null ? (
                    <button onClick={() => onClose(trade)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Close</button>
                  ) : (
                    <span className="text-xs text-slate-400">Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WithdrawalsTable({
  withdrawals,
  onApprove,
  onReject,
}: {
  withdrawals: Withdrawal[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Panel title="Заявки на вывод">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="border-b border-emerald-100 text-left text-slate-500">
              <th className="p-3">Клиент</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Метод</th>
              <th className="p-3">Реквизиты</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Действие</th>
            </tr>
          </thead>

          <tbody>
            {withdrawals.map((item) => (
              <tr key={item.id} className="border-b border-emerald-50">
                <td className="p-3">
                  <p className="font-bold text-slate-950">
                    {item.user?.email || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {displayName(item.user || {})}
                  </p>
                </td>

                <td className="p-3 font-bold">
                  ${Number(item.amount).toFixed(2)}
                </td>

                <td className="p-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {withdrawalMethodLabel(item.method)}
                  </span>
                </td>

                <td className="p-3 min-w-[420px]">
  <WithdrawalDetails item={item} />
</td>

                <td className="p-3">
                  <Badge value={item.status} />
                </td>

                <td className="p-3 text-slate-500">
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>

                <td className="p-3">
                  {item.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApprove(item.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => onReject(item.id)}
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Processed</span>
                  )}
                </td>
              </tr>
            ))}

            {withdrawals.length === 0 && (
              <tr>
                <td className="p-5 text-slate-500" colSpan={7}>
                  Заявок на вывод пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
function WithdrawalDetails({ item }: { item: Withdrawal }) {
  const details = parseWithdrawalDetails(item);

  if (details?.type === "CARD") {
    return (
      <div>
        <p className="font-bold text-slate-950">
          {details.cardHolder || "-"}
        </p>
        <p className="text-xs text-slate-500">
  Номер карты: {details.cardNumber || "-"}
</p>

<p className="text-xs text-slate-500">
  Срок действия: {details.expiry || "-"}
</p>
      </div>
    );
  }

  if (details?.type === "CRYPTO") {
    return (
  <div>
    <p className="font-bold text-slate-950">
      {details.currency || "-"}
    </p>

    <p className="break-all text-xs text-slate-500">
      {details.wallet || "-"}
    </p>
  </div>
);
  }

  if (details?.type === "BANK") {
    return (
  <div className="space-y-1">
    <p className="font-bold text-slate-950">
      {details.beneficiary || "-"}
    </p>

    <p className="text-xs text-slate-500">
      Банк: {details.bankName || "-"}
    </p>

    <p className="text-xs text-slate-500">
      Счёт: {details.accountNumber || "-"}
    </p>

    <p className="text-xs text-slate-500">
      SWIFT: {details.swift || "-"}
    </p>
  </div>
);
  }

  return (
    <p className="max-w-xs truncate text-slate-500">
      {item.destination || item.details || "-"}
    </p>
  );
}

function parseWithdrawalDetails(item: Withdrawal) {
  if (!item.details) {
    return null;
  }

  try {
    return JSON.parse(item.details);
  } catch {
    return null;
  }
}

function withdrawalMethodLabel(value: string) {
  if (value === "CARD" || value === "Bank Card") return "Карта";
  if (value === "CRYPTO" || value === "Crypto Wallet") return "Крипто";
  if (value === "BANK" || value === "Bank Account") return "Банк";
  return value;
}

function maskCard(value: string) {
  const clean = value.replace(/\D/g, "");

  if (clean.length < 4) {
    return "••••";
  }

  return `•••• ${clean.slice(-4)}`;
}
function KycTable({ documents, onReview }: { documents: VerificationDocument[]; onReview: (id: string, status: "APPROVED" | "REJECTED") => void }) {
  async function openDocument(doc: VerificationDocument) {
    if (!doc.fileUrl) {
      alert("Файл документа недоступен");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      alert("Браузер заблокировал открытие документа");
      return;
    }

    try {
      win.document.title = doc.fileName;
      win.document.body.style.margin = "0";
      win.document.body.style.background = "#f8fafc";
      win.document.body.textContent = "Загрузка документа...";

      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const mimeType = doc.mimeType || blob.type || "application/octet-stream";

      win.document.body.textContent = "";

      if (mimeType.startsWith("image/")) {
        const image = win.document.createElement("img");
        image.src = fileUrl;
        image.alt = doc.fileName;
        image.style.display = "block";
        image.style.maxWidth = "100%";
        image.style.height = "auto";
        image.style.margin = "0 auto";
        win.document.body.appendChild(image);
        return;
      }

      const frame = win.document.createElement("iframe");
      frame.src = fileUrl;
      frame.title = doc.fileName;
      frame.style.width = "100vw";
      frame.style.height = "100vh";
      frame.style.border = "0";
      win.document.body.appendChild(frame);
    } catch {
      win.document.body.textContent = "Не удалось открыть документ";
    }
  }

  return <Panel title="Верификация клиентов"><div className="overflow-x-auto"><table className="min-w-[860px] w-full text-sm"><thead><tr className="border-b border-emerald-100 text-left text-slate-500"><th className="p-3">Клиент</th><th className="p-3">Документ</th><th className="p-3">Файл</th><th className="p-3">Статус</th><th className="p-3">Действие</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id} className="border-b border-emerald-50"><td className="p-3">{doc.user?.email}</td><td className="p-3">{doc.documentType || "DOCUMENT"}</td><td className="p-3"><div className="flex flex-col gap-2"><span className="break-all">{doc.fileName}</span><button type="button" onClick={() => openDocument(doc)} disabled={!doc.fileUrl} className="w-fit rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">Открыть</button></div></td><td className="p-3"><Badge value={doc.status} /></td><td className="p-3">{doc.status === "PENDING" ? <div className="flex gap-2"><button onClick={() => onReview(doc.id, "APPROVED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button><button onClick={() => onReview(doc.id, "REJECTED")} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Reject</button></div> : <span className="text-xs text-slate-400">Reviewed</span>}</td></tr>)}</tbody></table></div></Panel>;
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

