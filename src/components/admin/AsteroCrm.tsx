"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ManualQuotesPanel from "@/components/admin/ManualQuotesPanel";
import { calculateTradeProfit, formatPrice } from "@/lib/market-instruments";

type ManagerRef = {
  id: string;
  email: string;
  plainPassword?: string | null;
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
  reminderMinutes?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  manager?: ManagerRef | null;
};

type VerificationDocument = {
  id: string;
  documentType: string;
  fileName: string;
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
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentBase64?: string | null;
  createdAt: string;
  user?: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type SupportConversation = {
  userId: string;
  status: "OPEN" | "CLOSED";
  closedAt?: string | null;
  updatedAt?: string | null;
};

type Announcement = {
  id: string;
  title: string;
  text: string;
  imageName?: string | null;
  imageMimeType?: string | null;
  imageBase64?: string | null;
  fontSize: number;
  textColor: string;
  fontFamily: string;
  isPublished: boolean;
  updatedAt: string;
};

type SupportToast = {
  userId: string;
  clientName: string;
  message: string;
};

type AttachmentPayload = {
  name: string;
  mimeType: string;
  base64: string;
};

type WindowWithAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type User = {
  id: string;
  clientNumber?: string | null;
  email: string;
  plainPassword?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  balance: number;
  role: string;
  isBlocked: boolean;
  clientStatus?: string | null;
  tradingEnabled: boolean;
  kycStatus: string;
  managerId?: string | null;
  manager?: ManagerRef | null;
  createdAt: string;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
  lastIp?: string | null;
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
  adminComment?: string | null;
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

type Deposit = {
  id: string;
  amount: number;
  method?: string | null;
  status: string;
  details?: string | null;
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
  closedAt?: string | null;
  user: {
    id?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    managerId?: string | null;
  };
};

type TradeUpdatePayload = {
  openPrice?: number;
  volume?: number;
  swap?: number;
  profit?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
};

type Tab =
  | "desktop"
  | "clients"
  | "clientCard"
  | "actions"
  | "managers"
  | "tradeOperations"
  | "trades"
  | "withdrawals"
  | "verification"
  | "support"
  | "announcements"
  | "quotes";

const tabs: { id: Tab; label: string; hint: string; icon: string }[] = [
  { id: "desktop", label: "Обзор", hint: "Сводка", icon: "□" },
  { id: "clients", label: "Клиенты", hint: "База", icon: "◎" },
  { id: "actions", label: "Действия", hint: "Задачи", icon: "◇" },
  { id: "managers", label: "Менеджеры", hint: "Команда", icon: "♟" },
  { id: "tradeOperations", label: "Торговые операции", hint: "Операции", icon: "TO" },
  { id: "withdrawals", label: "Выводы", hint: "Заявки", icon: "⇄" },
  { id: "verification", label: "Верификация", hint: "Документы", icon: "✓" },
  { id: "support", label: "Поддержка", hint: "Чаты", icon: "✉" },
  { id: "announcements", label: "Доска объявлений", hint: "Новости", icon: "!" },
  { id: "quotes", label: "Котировки", hint: "Цены", icon: "⌁" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";
const areaClass =
  "min-h-24 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

function readSessionValue(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.sessionStorage.getItem(key) || fallback;
}

export default function AsteroCrm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("desktop");
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([]);
  const [supportText, setSupportText] = useState("");
  const [supportAttachment, setSupportAttachment] = useState<AttachmentPayload | null>(null);
  const [supportClientId, setSupportClientId] = useState("");
  const [supportError, setSupportError] = useState("");
  const [supportToast, setSupportToast] = useState<SupportToast | null>(null);
  const [actionReminder, setActionReminder] = useState<{ title: string; clientName: string; minutes: number } | null>(null);
  const [supportUnreadIds, setSupportUnreadIds] = useState<Set<string>>(new Set());
  const [showPasswords, setShowPasswords] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState(() => readSessionValue("astero.crm.clientSearch"));
  const [actionPeriod, setActionPeriod] = useState<"overdue" | "today" | "future">("today");
  const [clientQuickFilter, setClientQuickFilter] = useState<"all" | "active" | "online" | "blocked" | "buffer" | "kyc" | "unverified">("all");
  const [depositAmount, setDepositAmount] = useState("0");
  const [balanceAmount, setBalanceAmount] = useState("1000");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState("OPEN");
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    reminderMinutes: "",
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
  const seenSupportMessageIdsRef = useRef<Set<string>>(new Set());
  const actionReminderKeysRef = useRef<Set<string>>(new Set());
  const supportMessagesReadyRef = useRef(false);
  const supportToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openTab(tabId: Tab) {
    setActiveTab(tabId);
    const nextUrl = tabId === "desktop" ? "/crm" : `/crm?tab=${tabId}`;
    window.history.replaceState(null, "", nextUrl);
  }

  function playSupportSound() {
    try {
      const AudioCtor =
        window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;

      if (!AudioCtor) return;

      const audio = new AudioCtor();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(1040, audio.currentTime);
      oscillator.frequency.setValueAtTime(780, audio.currentTime + 0.11);
      oscillator.frequency.setValueAtTime(1180, audio.currentTime + 0.22);
      gain.gain.setValueAtTime(0.001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.32, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.46);
    } catch {
      // Browsers can block sound until the admin interacts with the page.
    }
  }

  function notifySupportMessage(supportMessage: SupportMessage, allClients: User[]) {
    const client = allClients.find((item) => item.id === supportMessage.userId);
    const clientName = client ? displayName(client) : supportMessage.user?.email || "Клиент";

    setSupportToast({
      userId: supportMessage.userId,
      clientName,
      message: supportMessage.message,
    });

    playSupportSound();
  }

  async function loadAdminData(options: { silent?: boolean } = {}) {
    if (!options.silent) setLoading(true);
    const role = localStorage.getItem("role") || "";
    const currentUserId = localStorage.getItem("userId") || "";
    const res = await fetch(`/api/admin/overview?role=${encodeURIComponent(role)}&requesterId=${encodeURIComponent(currentUserId)}`, { cache: "no-store" });
    const data = await res.json();
    const supportRes = await fetch("/api/admin/support", { cache: "no-store" });
    const supportPayload = await supportRes.json().catch(() => null);
    setSupportError("");

    if (!supportRes.ok) {
      setSupportError(
        `${supportPayload?.error || "Support load failed"}${
          supportPayload?.details ? `: ${supportPayload.details}` : ""
        }`
      );
    }
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
    setDeposits(
      role === "MANAGER" && currentUserId
        ? (data.deposits || []).filter((item: Deposit) => item.user.managerId === currentUserId)
        : data.deposits || []
    );
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

    const allSupportMessages: SupportMessage[] = Array.isArray(supportPayload)
      ? supportPayload
      : supportPayload?.messages || [];
    const allSupportConversations: SupportConversation[] = Array.isArray(supportPayload)
      ? []
      : supportPayload?.conversations || [];

    const visibleSupportMessages: SupportMessage[] =
      role === "MANAGER" && currentUserId
        ? allSupportMessages.filter((item: SupportMessage) => {
            const client = allClients.find((client) => client.id === item.userId);
            return client?.managerId === currentUserId;
          })
        : allSupportMessages;

    const visibleSupportConversations: SupportConversation[] =
      role === "MANAGER" && currentUserId
        ? allSupportConversations.filter((item) => {
            const client = allClients.find((client) => client.id === item.userId);
            return client?.managerId === currentUserId;
          })
        : allSupportConversations;

    const newClientMessages = visibleSupportMessages
      .filter((item) => {
        const isClientMessage = item.sender === "CLIENT" || item.fromRole === "CLIENT";
        return isClientMessage && !seenSupportMessageIdsRef.current.has(item.id);
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    setSupportMessages(visibleSupportMessages);
    setSupportConversations(visibleSupportConversations);
    setSupportClientId((prev) => prev || visibleSupportMessages[0]?.userId || visibleClients[0]?.id || "");
    setSelectedClientId((prev) => prev || visibleClients[0]?.id || "");

    if (supportMessagesReadyRef.current && newClientMessages.length > 0) {
      notifySupportMessage(newClientMessages[newClientMessages.length - 1], allClients);
      setSupportUnreadIds((prev) => {
        const next = new Set(prev);
        newClientMessages.forEach((item) => next.add(item.userId));
        return next;
      });
    }

    seenSupportMessageIdsRef.current = new Set(visibleSupportMessages.map((item) => item.id));
    supportMessagesReadyRef.current = true;

    if (!options.silent) setLoading(false);
  }

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as Tab | null;
    if (tabFromUrl && tabs.some((tab) => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
    const clientIdFromUrl = searchParams.get("clientId");
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN" && role !== "MANAGER") {
      router.push("/");
      return;
    }
    const initialTimer = window.setTimeout(() => {
      setAllowed(true);
      loadAdminData();
    }, 0);

    const interval = setInterval(() => {
      loadAdminData({ silent: true });
    }, 10000);

    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(interval);
      if (supportToastTimerRef.current) {
        clearTimeout(supportToastTimerRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    sessionStorage.setItem("astero.crm.clientSearch", clientSearch);
  }, [clientSearch]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0],
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch = `${client.id} ${client.clientNumber || ""} ${client.email} ${client.firstName || ""} ${client.lastName || ""} ${client.phone || ""} ${client.country || ""} ${client.city || ""} ${client.address || ""} ${client.manager?.email || ""} ${client.manager?.firstName || ""} ${client.manager?.lastName || ""}`
        .toLowerCase()
        .includes(q);
      const isBuffer = client.clientStatus === "BUFFER";
      const matchesQuickFilter =
        (clientQuickFilter === "buffer" && isBuffer) ||
        (!isBuffer && (
          clientQuickFilter === "all" ||
          (clientQuickFilter === "active" && !client.isBlocked) ||
          (clientQuickFilter === "online" && isClientOnline(client)) ||
          (clientQuickFilter === "blocked" && client.isBlocked) ||
          (clientQuickFilter === "kyc" && client.kycStatus === "APPROVED") ||
          (clientQuickFilter === "unverified" && client.kycStatus !== "APPROVED")
        ));

      return matchesSearch && matchesQuickFilter;
    });
  }, [clients, clientQuickFilter, clientSearch]);

  const searchedClientIds = new Set(filteredClients.map((client) => client.id));
  const allActions = clients.flatMap((client) =>
    (client.clientActions || []).map((action) => ({ ...action, client }))
  ).filter((action) => !clientSearch.trim() || searchedClientIds.has(action.client.id));
  const openActions = allActions.filter((action) => action.status !== "CLOSED");
  const overdueActions = openActions.filter((action) => new Date(action.dueAt).getTime() < now);
  const pendingWithdrawals = withdrawals.filter((item) => item.status === "PENDING");
  const pendingKyc = verificationDocuments.filter((doc) => doc.status === "PENDING");
  const totalBalance = clients.reduce((sum, client) => sum + Number(client.balance || 0), 0);
  const filteredActions = allActions.filter((action) => {
    const due = new Date(action.dueAt);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    if (actionPeriod === "overdue") return due < start && action.status !== "CLOSED";
    if (actionPeriod === "today") return due >= start && due < end;
    return due >= end;
  });

  useEffect(() => {
    const currentTime = Date.now();

    for (const action of openActions) {
      if (!action.reminderMinutes) continue;
      const dueTime = new Date(action.dueAt).getTime();
      const minutesLeft = Math.ceil((dueTime - currentTime) / 60000);
      const matchedMinute = minutesLeft <= action.reminderMinutes && minutesLeft > action.reminderMinutes - 1 ? action.reminderMinutes : null;

      if (!matchedMinute) continue;

      const key = `${action.id}:${matchedMinute}`;
      if (actionReminderKeysRef.current.has(key)) continue;

      actionReminderKeysRef.current.add(key);
      playSupportSound();
      setActionReminder({
        title: action.title,
        clientName: action.client ? displayName(action.client) : "Клиент",
        minutes: matchedMinute,
      });
      break;
    }
  }, [now, openActions]);

  function openClientCard(client: User) {
    setSelectedClientId(client.id);
    setDepositAmount("0");
    setBalanceAmount("0");
    setNoteText("");
    setNoteStatus("OPEN");
    setActionForm({ title: "", description: "", dueAt: "", reminderMinutes: "", status: "OPEN", managerId: "" });
    openTab("clientCard");
    window.history.replaceState(null, "", `/crm?tab=clientCard&clientId=${encodeURIComponent(client.id)}`);
  }

  async function createUser(role: "CLIENT" | "MANAGER") {
    setMessage(role === "MANAGER" ? "Создаю менеджера..." : "Создаю клиента...");
    const currentRole = localStorage.getItem("role");
    const currentUserId = localStorage.getItem("userId");
    const payload = role === "MANAGER"
      ? { ...newManager, role }
      : { ...newClient, role, managerId: currentRole === "MANAGER" ? currentUserId : newClient.managerId };
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
    if (!amount || Number.isNaN(amount)) return alert("Введите корректную сумму");
    const client = clients.find((item) => item.id === userId);
    const actionText = amount < 0 ? "Списать" : "Начислить";
    if (!confirm(`${actionText} ${displayName(client || { email: userId })} €${Math.abs(amount).toFixed(2)}?`)) return;
    const res = await fetch("/api/admin/users/deposit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка депозита");
    await loadAdminData();
  }

  async function toggleClientTrading(userId: string, tradingEnabled: boolean) {
    const client = clients.find((item) => item.id === userId);
    const action = tradingEnabled ? "запретить" : "разрешить";
    if (!confirm(`${action[0].toUpperCase()}${action.slice(1)} торговлю для ${displayName(client || { email: userId })}?`)) return;

    const res = await fetch("/api/admin/users/trading", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tradingEnabled: !tradingEnabled }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Не удалось изменить разрешение торговли");
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

  async function updateUser(userId: string, payload: Partial<User> & { password?: string }) {
    const res = await fetch("/api/admin/users/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка обновления пользователя");
    await loadAdminData();
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

  async function toggleBufferUser(userId: string, currentStatus?: string | null) {
    const nextStatus = currentStatus === "BUFFER" ? "ACTIVE" : "BUFFER";
    const res = await fetch("/api/admin/users/block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, clientStatus: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка изменения статуса");
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
    const comment = prompt("Комментарий для клиента при одобрении вывода:", "");
    const res = await fetch("/api/admin/withdrawals/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, comment }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка подтверждения");
    await loadAdminData();
  }

  async function rejectWithdrawal(withdrawalId: string) {
    const comment = prompt("Комментарий для клиента при отклонении вывода:", "");
    const res = await fetch("/api/admin/withdrawals/reject", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, comment }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка отклонения");
    await loadAdminData();
  }

  async function updateWithdrawalRequisites(withdrawal: Withdrawal) {
    const currentDetails = parseWithdrawalDetails(withdrawal) || {};
    const currentMethod = String(currentDetails.type || withdrawal.method || "CARD").toUpperCase();
    const method = prompt("Метод вывода: CARD, CRYPTO или BANK", currentMethod);
    if (!method) return;

    const normalizedMethod = method.trim().toUpperCase();
    let details: Record<string, string> = { type: normalizedMethod };
    let destination = withdrawal.destination || "";

    if (normalizedMethod === "CARD") {
      const cardHolder = prompt("Имя держателя карты", String(currentDetails.cardHolder || "")) ?? "";
      const cardNumber = prompt("Номер карты", String(currentDetails.cardNumber || withdrawal.destination || "")) ?? "";
      const expiry = prompt("Срок действия карты", String(currentDetails.expiry || "")) ?? "";
      details = { type: "CARD", cardHolder, cardNumber, expiry };
      destination = cardNumber;
    } else if (normalizedMethod === "CRYPTO") {
      const currency = prompt("Валюта/сеть", String(currentDetails.currency || "")) ?? "";
      const wallet = prompt("Адрес кошелька", String(currentDetails.wallet || withdrawal.destination || "")) ?? "";
      details = { type: "CRYPTO", currency, wallet };
      destination = wallet;
    } else if (normalizedMethod === "BANK") {
      const beneficiary = prompt("Получатель", String(currentDetails.beneficiary || "")) ?? "";
      const bankName = prompt("Банк", String(currentDetails.bankName || "")) ?? "";
      const accountNumber = prompt("Номер счета / IBAN", String(currentDetails.accountNumber || withdrawal.destination || "")) ?? "";
      const swift = prompt("SWIFT", String(currentDetails.swift || "")) ?? "";
      details = { type: "BANK", beneficiary, bankName, accountNumber, swift };
      destination = accountNumber;
    } else {
      destination = prompt("Реквизиты", withdrawal.destination || withdrawal.details || "") ?? "";
      details = { type: normalizedMethod, text: destination };
    }

    const res = await fetch("/api/admin/withdrawals/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        withdrawalId: withdrawal.id,
        method: normalizedMethod,
        destination,
        details,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка сохранения реквизитов");
    await loadAdminData();
  }

  async function approveDeposit(depositId: string) {
    const res = await fetch("/api/admin/deposits/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка подтверждения пополнения");
    await loadAdminData();
  }

  async function rejectDeposit(depositId: string) {
    const res = await fetch("/api/admin/deposits/reject", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка отклонения пополнения");
    await loadAdminData();
  }

  async function closeClientTrade(trade: Trade) {
    let closePrice = trade.openPrice;
    try {
      const quoteRes = await fetch(`/api/quotes?symbol=${encodeURIComponent(trade.symbol)}`, { cache: "no-store" });
      const quote = await quoteRes.json();
      if (quoteRes.ok) {
        closePrice = Number(trade.side === "BUY" ? quote.bid || quote.price : quote.ask || quote.price);
      }
    } catch {
      closePrice = trade.openPrice;
    }

    if (!closePrice || Number.isNaN(closePrice)) return alert("Не удалось получить рыночную цену");
    if (!confirm(`Закрыть ${trade.symbol} ${trade.side} по рынку ${formatPrice(trade.symbol, closePrice)}?`)) return;

    const res = await fetch("/api/trade/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId: trade.id, closePrice }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка закрытия сделки");
    await loadAdminData();
  }

  async function updateClientTrade(tradeId: string, payload: TradeUpdatePayload) {
    const res = await fetch("/api/admin/trades/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Trade update error");
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

  async function updateNote(noteId: string, payload: Partial<{ status: string; text: string }>) {
    const res = await fetch("/api/admin/client-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, ...payload }),
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
        dueAt: new Date(actionForm.dueAt).toISOString(),
        reminderMinutes: actionForm.reminderMinutes ? Number(actionForm.reminderMinutes) : null,
        status: actionForm.status,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка действия");
    setActionForm({ title: "", description: "", dueAt: "", reminderMinutes: "", status: "OPEN", managerId: "" });
    await loadAdminData();
  }

  async function updateAction(
    actionId: string,
    payload: Partial<{ title: string; description: string; status: string; dueAt: string; managerId: string; reminderMinutes: number | null }>
  ) {
    const nextPayload = payload.dueAt
      ? { ...payload, dueAt: new Date(payload.dueAt).toISOString() }
      : payload;
    const res = await fetch("/api/admin/client-actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, ...nextPayload }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Ошибка действия");
    await loadAdminData();
  }

  async function sendSupportMessage() {
    if (!supportClientId || (!supportText.trim() && !supportAttachment)) {
      return alert("Выберите клиента и введите сообщение");
    }

    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: supportClientId, message: supportText || (supportAttachment ? "Файл" : ""), attachment: supportAttachment, authorId: localStorage.getItem("userId") }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.error || "Ошибка отправки сообщения");
    }

    setSupportText("");
    setSupportAttachment(null);
    await loadAdminData();
  }

  async function attachSupportFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Файл должен быть до 5MB");
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setSupportAttachment({ name: file.name, mimeType: file.type || "application/octet-stream", base64 });
  }

  async function closeSupportConversation(userId: string) {
    if (!userId) return;

    const res = await fetch("/api/admin/support/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();

    if (!res.ok) {
      return alert(data.error || "Не удалось закрыть обращение");
    }

    await loadAdminData();
  }

  async function updateDepositDate(depositId: string, createdAt: string) {
    const res = await fetch("/api/admin/deposits/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, createdAt: new Date(createdAt).toISOString() }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return alert(data?.error || "Ошибка изменения даты депозита");
    await loadAdminData();
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Удалить заметку?")) return;
    const res = await fetch("/api/admin/client-notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return alert(data?.error || "Ошибка удаления заметки");
    await loadAdminData();
  }

  async function deleteArchivedSupportConversation(userId: string) {
    if (!userId || !confirm("Удалить обращение из архива?")) return;

    const res = await fetch("/api/admin/support", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return alert(data?.error || "Не удалось удалить обращение");
    }

    setSupportClientId((current) => (current === userId ? "" : current));
    await loadAdminData();
  }

  async function editSupportMessage(messageId: string, message: string) {
    const res = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, message }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error || "Не удалось изменить сообщение");
      return;
    }
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
              onClick={() => openTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-white/[0.04] text-emerald-50 hover:bg-white/[0.08]"
              }`}
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-black">
                {tab.icon}
                {tab.id === "support" && supportUnreadIds.size > 0 && (
                  <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-[#07170f]" />
                )}
              </span>
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
            <span>☰ {activeTab === "clientCard" ? "Карточка клиента" : tabs.find((tab) => tab.id === activeTab)?.label}</span>
            <span className="text-emerald-300">{mobileMenuOpen ? "Закрыть" : "Меню"}</span>
          </button>

          {mobileMenuOpen && (
            <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-emerald-400/10 bg-[#07170f] p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    openTab(tab.id);
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

        <div className="rounded-xl border border-emerald-400/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{activeTab === "clientCard" ? "Карточка клиента" : tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            </div>
            <input
              name="crm-client-search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-11 w-full rounded-xl border border-emerald-300/20 bg-slate-950/40 px-4 text-sm text-white outline-none placeholder:text-emerald-50/45 focus:border-emerald-400 lg:max-w-lg"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Поиск клиента: ID, телефон, email, имя, фамилия..."
            />
          </div>
        </div>

        {message && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">{message}</div>}

        {supportToast && (
          <div className="fixed right-4 top-24 z-[80] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-sky-300/40 bg-slate-950 p-3 text-white shadow-2xl shadow-sky-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Новое сообщение</p>
                <p className="mt-1 font-black">{supportToast.clientName}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-200">{supportToast.message || "Файл"}</p>
              </div>
              <button
                type="button"
                onClick={() => setSupportToast(null)}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs font-black text-white hover:bg-white/20"
              >
                x
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSupportClientId(supportToast.userId);
                openTab("support");
                setSupportToast(null);
              }}
              className="mt-3 w-full rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white hover:bg-sky-400"
            >
              Открыть чат
            </button>
          </div>
        )}

        {actionReminder && (
          <div className="fixed right-4 top-24 z-[85] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-amber-950 shadow-2xl shadow-amber-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Напоминание</p>
                <p className="mt-1 text-sm font-black">{actionReminder.clientName}</p>
                <p className="mt-1 text-sm">{actionReminder.title}</p>
                <p className="mt-2 text-xs font-bold text-amber-700">Через {actionReminder.minutes} минут</p>
              </div>
              <button
                type="button"
                onClick={() => setActionReminder(null)}
                className="rounded-lg bg-amber-200 px-2 py-1 text-xs font-black text-amber-900 hover:bg-amber-300"
              >
                x
              </button>
            </div>
          </div>
        )}

        {activeTab === "desktop" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              <Metric title="Клиенты" value={loading ? "..." : clients.length} />
              <Metric title="Менеджеры" value={managers.length} />
              <Metric title="Баланс клиентов" value={`€${totalBalance.toFixed(2)}`} />
              <Metric title="Открытые действия" value={openActions.length} />
              <Metric title="Просрочено" value={overdueActions.length} danger={overdueActions.length > 0} />
              <Metric title="KYC pending" value={pendingKyc.length} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Panel title="Ближайшие действия">
                <ActionList actions={openActions.slice(0, 8)} managers={managers} onUpdate={updateAction} onOpenClient={openClientCard} showClient />
              </Panel>
              <Panel title="Финансы и верификация">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MiniStat title="Заявки на вывод" value={pendingWithdrawals.length} />
                  <MiniStat title="Документы KYC" value={pendingKyc.length} />
                </div>
                <div className="mt-4 space-y-2">
                  {pendingWithdrawals.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-emerald-100 p-3 text-sm">
                      <b>{item.user.email}</b> — €{Number(item.amount).toFixed(2)} · {item.method}
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
            <Panel title={`Клиентская база: ${filteredClients.length} / ${clients.length}`}>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "Все"],
                    ["active", "Активные"],
                    ["online", "В сети"],
                    ["blocked", "Блокированные"],
                    ["buffer", "Бафер"],
                    ["kyc", "KYC"],
                    ["unverified", "Без KYC"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setClientQuickFilter(key as typeof clientQuickFilter)}
                      className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                        clientQuickFilter === key
                          ? "border-emerald-500 bg-emerald-500 text-slate-950"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input name="crm-client-table-search" autoComplete="off" autoCorrect="off" spellCheck={false} className={`${inputClass} lg:max-w-md`} placeholder="Поиск: email, имя, телефон, страна" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              </div>
              <ClientsTable
                clients={filteredClients}
                managers={managers}
                onAssign={assignManager}
                onOpen={openClientCard}
                onBlock={(client) => toggleBlockUser(client.id, client.isBlocked)}
                onDelete={(client) => deleteUser(client.id, client.email)}
              />
            </Panel>
          </div>
        )}

        {activeTab === "clientCard" && selectedClient && (
          <ClientProfileUtip
            selectedClient={selectedClient}
            managers={managers}
            assignManager={assignManager}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            depositToUser={depositToUser}
            toggleBlockUser={toggleBlockUser}
            toggleBufferUser={toggleBufferUser}
            toggleClientTrading={toggleClientTrading}
            passwords={passwords}
            setPasswords={setPasswords}
            showPasswords={showPasswords}
            changeClientPassword={changeClientPassword}
            actionForm={actionForm}
            setActionForm={setActionForm}
            addAction={addAction}
            updateAction={updateAction}
            noteText={noteText}
            setNoteText={setNoteText}
            noteStatus={noteStatus}
            setNoteStatus={setNoteStatus}
            addNote={addNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            deposits={deposits}
            withdrawals={withdrawals}
            trades={trades}
            documents={verificationDocuments}
            onCloseTrade={closeClientTrade}
            onUpdateTrade={updateClientTrade}
            onApproveDeposit={approveDeposit}
            onRejectDeposit={rejectDeposit}
            onUpdateDepositDate={updateDepositDate}
            onUpdateUser={updateUser}
            onDeleteClient={(client) => deleteUser(client.id, client.email)}
          />
        )}

        {activeTab === "actions" && (
          <Panel title="Действия">
            <div className="mb-3 flex flex-wrap gap-2">
              {([['overdue', 'Просроченные'], ['today', 'Сегодня'], ['future', 'Будущие']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setActionPeriod(key)} className={`rounded-lg px-3 py-2 text-xs font-black ${actionPeriod === key ? 'bg-emerald-500 text-slate-950' : 'border border-slate-200 bg-white text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
            <ActionList actions={filteredActions} managers={managers} onUpdate={updateAction} onOpenClient={openClientCard} showClient />
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
                  <ManagerEditCard
                    key={`edit-${manager.id}`}
                    manager={manager}
                    clientsCount={clients.filter((client) => client.managerId === manager.id).length}
                    onSave={(payload) => updateUser(manager.id, payload)}
                  />
                ))}
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

        {activeTab === "tradeOperations" && (
          <TradingOperationsDesk clients={filteredClients} trades={trades.filter((trade) => !clientSearch.trim() || (trade.user.id && searchedClientIds.has(trade.user.id)))} onClose={closeClientTrade} onUpdate={updateClientTrade} />
        )}
        {activeTab === "trades" && <TradeTable trades={trades} onClose={closeClientTrade} onUpdate={updateClientTrade} />}
        {activeTab === "withdrawals" && <WithdrawalsTable withdrawals={withdrawals.filter((item) => !clientSearch.trim() || (item.user.id && searchedClientIds.has(item.user.id)))} onApprove={approveWithdrawal} onReject={rejectWithdrawal} onEditRequisites={updateWithdrawalRequisites} />}
        {activeTab === "verification" && <KycTable documents={verificationDocuments.filter((doc) => !clientSearch.trim() || (doc.user?.id && searchedClientIds.has(doc.user.id)))} onReview={reviewDocument} />}
        {activeTab === "support" && (
          <SupportPanelV2
            clients={filteredClients}
            messages={supportMessages}
            conversations={supportConversations}
            error={supportError}
            unreadIds={supportUnreadIds}
            selectedClientId={supportClientId}
            setSelectedClientId={setSupportClientId}
            onReadClient={(clientId: string) => setSupportUnreadIds((prev) => {
              const next = new Set(prev);
              next.delete(clientId);
              return next;
            })}
            text={supportText}
            setText={setSupportText}
            attachment={supportAttachment}
            setAttachment={setSupportAttachment}
            onAttach={attachSupportFile}
            onSend={sendSupportMessage}
            onClose={closeSupportConversation}
            onDeleteArchive={deleteArchivedSupportConversation}
            onEditMessage={editSupportMessage}
          />
        )}
        {activeTab === "announcements" && <AnnouncementsAdminPanel />}
        {activeTab === "quotes" && <ManualQuotesPanel />}
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 text-slate-950 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] dark:text-white sm:p-5"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>;
}

function ManagerEditCard({
  manager,
  clientsCount,
  onSave,
}: {
  manager: User;
  clientsCount: number;
  onSave: (payload: Partial<User> & { password?: string }) => void;
}) {
  const [form, setForm] = useState({
    firstName: manager.firstName || "",
    lastName: manager.lastName || "",
    email: manager.email || "",
    phone: manager.phone || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm({
      firstName: manager.firstName || "",
      lastName: manager.lastName || "",
      email: manager.email || "",
      phone: manager.phone || "",
      password: "",
    });
  }, [manager.id]);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-black text-slate-950">{displayName(manager)}</p>
          <p className="text-xs text-slate-500">{clientsCount} клиентов</p>
        </div>
        <button
          type="button"
          onClick={() => onSave(form.password.trim() ? form : { ...form, password: undefined })}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
        >
          Сохранить
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <input className={`${inputClass} h-9 rounded-lg`} placeholder="Имя" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <input className={`${inputClass} h-9 rounded-lg`} placeholder="Фамилия" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        <input className={`${inputClass} h-9 rounded-lg`} placeholder="Почта" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className={`${inputClass} h-9 rounded-lg`} placeholder="Телефон" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <div className="relative">
          <input
            className={`${inputClass} h-9 rounded-lg pr-11`}
            placeholder="Новый пароль"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            title={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            <EyeIcon closed={showPassword} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ closed = false }: { closed?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.8 12.1C4.6 8.7 7.8 6.5 12 6.5C16.2 6.5 19.4 8.7 21.2 12.1C19.4 15.5 16.2 17.7 12 17.7C7.8 17.7 4.6 15.5 2.8 12.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.6C13.38 14.6 14.5 13.48 14.5 12.1C14.5 10.72 13.38 9.6 12 9.6C10.62 9.6 9.5 10.72 9.5 12.1C9.5 13.48 10.62 14.6 12 14.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {closed && <path d="M4 20L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

function AnnouncementsAdminPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [draft, setDraft] = useState({
    id: "",
    title: "",
    text: "",
    fontSize: 16,
    textColor: "#0f172a",
    fontFamily: "Inter",
    isPublished: true,
    image: null as AttachmentPayload | null,
  });
  const [message, setMessage] = useState("");

  async function loadAnnouncements() {
    const res = await fetch("/api/admin/announcements", { cache: "no-store" });
    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  async function attachImage(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Файл должен быть до 5MB");
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setDraft((prev) => ({ ...prev, image: { name: file.name, mimeType: file.type, base64 } }));
  }

  async function saveAnnouncement() {
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || "Не удалось сохранить объявление");
      return;
    }
    setMessage("Объявление сохранено");
    setDraft({
      id: "",
      title: "",
      text: "",
      fontSize: 16,
      textColor: "#0f172a",
      fontFamily: "Inter",
      isPublished: true,
      image: null,
    });
    await loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    const res = await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Не удалось удалить объявление");
      return;
    }
    if (draft.id === id) {
      setDraft({
        id: "",
        title: "",
        text: "",
        fontSize: 16,
        textColor: "#0f172a",
        fontFamily: "Inter",
        isPublished: true,
        image: null,
      });
    }
    setMessage("Объявление удалено");
    await loadAnnouncements();
  }

  function editAnnouncement(item: Announcement) {
    setDraft({
      id: item.id,
      title: item.title,
      text: item.text,
      fontSize: item.fontSize,
      textColor: item.textColor,
      fontFamily: item.fontFamily,
      isPublished: item.isPublished,
      image: null,
    });
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
      <Panel title="Редактор объявления">
        <div className="space-y-3">
          <input className={inputClass} placeholder="Заголовок" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <textarea className={areaClass} placeholder="Текст объявления" value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-black text-slate-500">
              Размер
              <input className={`${inputClass} mt-1`} type="number" min={12} max={42} value={draft.fontSize} onChange={(event) => setDraft({ ...draft, fontSize: Number(event.target.value) })} />
            </label>
            <label className="text-xs font-black text-slate-500">
              Цвет
              <input className={`${inputClass} mt-1 h-10 p-1`} type="color" value={draft.textColor} onChange={(event) => setDraft({ ...draft, textColor: event.target.value })} />
            </label>
          </div>
          <select className={inputClass} value={draft.fontFamily} onChange={(event) => setDraft({ ...draft, fontFamily: event.target.value })}>
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-black text-emerald-700">
            Добавить картинку
            <input type="file" accept="image/*" className="hidden" onChange={(event) => attachImage(event.target.files?.[0] || null)} />
          </label>
          {draft.image && <p className="truncate rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{draft.image.name}</p>}
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} />
            Опубликовать
          </label>
          <button type="button" onClick={saveAnnouncement} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700">
            Сохранить
          </button>
          {message && <p className="text-sm font-bold text-emerald-700">{message}</p>}
        </div>
      </Panel>

      <Panel title="Опубликованные объявления">
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => {
            const imageUrl = item.imageBase64 && item.imageMimeType ? `data:${item.imageMimeType};base64,${item.imageBase64}` : "";
            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left hover:border-emerald-300">
                {imageUrl && <img src={imageUrl} alt={item.title || "announcement"} className="h-36 w-full object-cover" />}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-slate-950">{item.title || "Без заголовка"}</p>
                    <Badge value={item.isPublished ? "PUBLISHED" : "HIDDEN"} />
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line" style={{ color: item.textColor, fontSize: item.fontSize, fontFamily: item.fontFamily }}>
                    {item.text}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => editAnnouncement(item)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">
                      Редактировать
                    </button>
                    <button type="button" onClick={() => deleteAnnouncement(item.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <Empty text="Объявлений пока нет" />}
        </div>
      </Panel>
    </div>
  );
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

function clientDisplayNumber(client: Pick<User, "id" | "clientNumber">) {
  return client.clientNumber || client.id.slice(-6).toUpperCase();
}

function isClientOnline(user: User) {
  return Boolean(user.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 2 * 60 * 1000);
}

function ClientRow({ client, onOpen, active }: { client: User; onOpen: () => void; active?: boolean }) {
  return <button onClick={onOpen} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-emerald-500 bg-emerald-50" : "border-emerald-100 bg-white hover:bg-emerald-50"}`}><p className="font-black text-slate-950">{displayName(client)}</p><p className="text-xs text-slate-500">{client.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge value={client.kycStatus} /><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></div></button>;
}

function ClientProfileUtip({
  selectedClient,
  managers,
  assignManager,
  depositAmount,
  setDepositAmount,
  depositToUser,
  toggleBlockUser,
  toggleBufferUser,
  toggleClientTrading,
  passwords,
  setPasswords,
  showPasswords,
  changeClientPassword,
  actionForm,
  setActionForm,
  addAction,
  updateAction,
  noteText,
  setNoteText,
  noteStatus,
  setNoteStatus,
  addNote,
  updateNote,
  deleteNote,
  deposits,
  withdrawals,
  trades,
  documents,
  onCloseTrade,
  onUpdateTrade,
  onApproveDeposit,
  onRejectDeposit,
  onUpdateDepositDate,
  onUpdateUser,
  onDeleteClient,
}: {
  selectedClient: User;
  managers: User[];
  assignManager: (userId: string, managerId: string) => void;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  depositToUser: (userId: string) => void;
  toggleBlockUser: (userId: string, isBlocked: boolean) => void;
  toggleBufferUser: (userId: string, currentStatus?: string | null) => void;
  toggleClientTrading: (userId: string, tradingEnabled: boolean) => void;
  passwords: Record<string, string>;
  setPasswords: (value: Record<string, string>) => void;
  showPasswords: boolean;
  changeClientPassword: (userId: string) => void;
  actionForm: { title: string; description: string; dueAt: string; reminderMinutes: string; status: string; managerId: string };
  setActionForm: (value: { title: string; description: string; dueAt: string; reminderMinutes: string; status: string; managerId: string }) => void;
  addAction: () => void;
  updateAction: (id: string, payload: Partial<{ title: string; description: string; status: string; dueAt: string; managerId: string; reminderMinutes: number | null }>) => void;
  noteText: string;
  setNoteText: (value: string) => void;
  noteStatus: string;
  setNoteStatus: (value: string) => void;
  addNote: () => void;
  updateNote: (noteId: string, payload: Partial<{ status: string; text: string }>) => void;
  deleteNote: (noteId: string) => void;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  trades: Trade[];
  documents: VerificationDocument[];
  onCloseTrade: (trade: Trade) => void;
  onUpdateTrade: (tradeId: string, payload: TradeUpdatePayload) => void;
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  onUpdateDepositDate: (depositId: string, createdAt: string) => void;
  onUpdateUser: (userId: string, payload: Partial<User> & { password?: string }) => void;
  onDeleteClient: (client: User) => void;
}) {
  const [clientSection, setClientSection] = useState<
    "overview" | "history" | "documents" | "accounts" | "operations" | "deposits" | "requests" | "tickets" | "mailing"
  >("overview");
  const [numberCopied, setNumberCopied] = useState(false);
  const [showClientPassword, setShowClientPassword] = useState(false);
  const [notePage, setNotePage] = useState(1);
  const [editClient, setEditClient] = useState({
    firstName: selectedClient.firstName || "",
    lastName: selectedClient.lastName || "",
    email: selectedClient.email || "",
    phone: selectedClient.phone || "",
    country: selectedClient.country || "",
    city: selectedClient.city || "",
    address: selectedClient.address || "",
    kycStatus: selectedClient.kycStatus || "PENDING",
    managerId: selectedClient.managerId || "",
  });
  useEffect(() => {
    setEditClient({
      firstName: selectedClient.firstName || "",
      lastName: selectedClient.lastName || "",
      email: selectedClient.email || "",
      phone: selectedClient.phone || "",
      country: selectedClient.country || "",
      city: selectedClient.city || "",
      address: selectedClient.address || "",
      kycStatus: selectedClient.kycStatus || "PENDING",
      managerId: selectedClient.managerId || "",
    });
  }, [selectedClient.id]);
  const clientActions = (selectedClient.clientActions || []).map((action) => ({ ...action, client: selectedClient }));
  const clientTrades = trades.filter((trade) => trade.user.id === selectedClient.id || trade.user.email === selectedClient.email);
  const clientDeposits = deposits.filter((item) => item.user.id === selectedClient.id || item.user.email === selectedClient.email);
  const clientWithdrawals = withdrawals.filter((item) => item.user.id === selectedClient.id || item.user.email === selectedClient.email);
  const clientDocs = documents.filter((doc) => doc.user?.id === selectedClient.id || doc.user?.email === selectedClient.email);
  const sortedNotes = [...(selectedClient.clientNotes || [])].sort((a, b) => {
    if (a.status === "IMPORTANT" && b.status !== "IMPORTANT") return -1;
    if (a.status !== "IMPORTANT" && b.status === "IMPORTANT") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const notePageSize = 10;
  const notePageCount = Math.max(1, Math.ceil(sortedNotes.length / notePageSize));
  const visibleNotes = sortedNotes.slice((notePage - 1) * notePageSize, notePage * notePageSize);

  useEffect(() => {
    setNotePage(1);
  }, [selectedClient.id]);

  useEffect(() => {
    if (notePage > notePageCount) setNotePage(notePageCount);
  }, [notePage, notePageCount]);

  return (
    <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Клиент</p>
              <h2 className="text-xl font-black text-slate-950">{displayName(selectedClient)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge value={selectedClient.kycStatus} />
              <Badge value={selectedClient.isBlocked ? "BLOCKED" : "ACTIVE"} />
              <span className={`rounded-full px-3 py-1 text-xs font-black ${selectedClient.tradingEnabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {selectedClient.tradingEnabled ? "Торговля разрешена" : "Торговля запрещена"}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${isClientOnline(selectedClient) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {isClientOnline(selectedClient) ? "Онлайн" : "Не в сети"}
              </span>
              {selectedClient.clientStatus === "BUFFER" && <Badge value="BUFFER" />}
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                ID {clientDisplayNumber(selectedClient)}
                <button
                  type="button"
                  title="Копировать номер клиента"
                  onClick={async () => {
                    await navigator.clipboard.writeText(clientDisplayNumber(selectedClient));
                    setNumberCopied(true);
                    window.setTimeout(() => setNumberCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-black text-emerald-700 shadow-sm hover:bg-emerald-50"
                >
                  <span aria-hidden="true">⧉</span>
                  {numberCopied ? "Скопировано" : "Копировать"}
                </button>
              </span>
              <button
                type="button"
                onClick={() => toggleBufferUser(selectedClient.id, selectedClient.clientStatus)}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 hover:bg-amber-100"
              >
                {selectedClient.clientStatus === "BUFFER" ? "Убрать Бафер" : "Бафер"}
              </button>
              <button
                type="button"
                onClick={() => toggleBlockUser(selectedClient.id, selectedClient.isBlocked)}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 hover:bg-orange-100"
              >
                {selectedClient.isBlocked ? "Разблокировать" : "Блок"}
              </button>
              <button
                type="button"
                onClick={() => onDeleteClient(selectedClient)}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-100"
              >
                Удалить счет
              </button>
            </div>
          </div>

          <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              ["overview", "Обзор"],
              ["history", "История"],
              ["documents", "Документы"],
              ["accounts", "Торговые счета"],
              ["operations", "Торговые операции"],
              ["deposits", "Депозиты"],
              ["requests", "Заявки"],
              ["tickets", "Тикеты"],
              ["mailing", "Рассылка"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setClientSection(key as typeof clientSection)}
                className={`shrink-0 rounded-md px-3 py-2 text-xs font-black transition ${
                  clientSection === key ? "bg-emerald-500 text-slate-950" : "text-slate-600 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {clientSection === "overview" && (
            <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-slate-950">Редактировать данные клиента</h3>
                <button
                  type="button"
                  onClick={() => onUpdateUser(selectedClient.id, editClient)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                >
                  Сохранить
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Имя" value={editClient.firstName} onChange={(event) => setEditClient({ ...editClient, firstName: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Фамилия" value={editClient.lastName} onChange={(event) => setEditClient({ ...editClient, lastName: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Email" value={editClient.email} onChange={(event) => setEditClient({ ...editClient, email: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Телефон" value={editClient.phone} onChange={(event) => setEditClient({ ...editClient, phone: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Страна" value={editClient.country} onChange={(event) => setEditClient({ ...editClient, country: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Город" value={editClient.city} onChange={(event) => setEditClient({ ...editClient, city: event.target.value })} />
                <input className={`${inputClass} h-9 rounded-lg`} placeholder="Адрес" value={editClient.address} onChange={(event) => setEditClient({ ...editClient, address: event.target.value })} />
                <select className={`${inputClass} h-9 rounded-lg`} value={editClient.kycStatus} onChange={(event) => setEditClient({ ...editClient, kycStatus: event.target.value })}>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <select className={`${inputClass} h-9 rounded-lg md:col-span-2`} value={editClient.managerId} onChange={(event) => setEditClient({ ...editClient, managerId: event.target.value })}>
                  <option value="">Без менеджера</option>
                  {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
                </select>
              </div>
            </div>
          )}

          {clientSection === "overview" && <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <UtipInfoPanel title="Общая информация">
              <UtipRow label="Имя" value={selectedClient.firstName || "-"} />
              <UtipRow label="Фамилия" value={selectedClient.lastName || "-"} />
              <UtipRow label="Статус" value={selectedClient.kycStatus} />
              <UtipRow label="Баланс" value={`€${Number(selectedClient.balance || 0).toFixed(2)}`} />
              <UtipRow label="Создан" value={new Date(selectedClient.createdAt).toLocaleString("ru-RU")} />
              <UtipRow label="Последний вход" value={selectedClient.lastLoginAt ? new Date(selectedClient.lastLoginAt).toLocaleString("ru-RU") : "Еще не входил"} />
              <UtipRow label="Последняя активность" value={selectedClient.lastSeenAt ? new Date(selectedClient.lastSeenAt).toLocaleString("ru-RU") : "Нет данных"} />
              <UtipRow label="IP-адрес" value={selectedClient.lastIp || "Нет данных"} />
              <UtipRow label="Менеджер" value={selectedClient.manager ? displayName(selectedClient.manager) : "Не назначен"} />
            </UtipInfoPanel>

            <UtipInfoPanel title="Контактная информация">
              <UtipRow label="Email" value={selectedClient.email} />
              <UtipRow label="Телефон" value={selectedClient.phone || "-"} copyValue={selectedClient.phone || undefined} />
              <UtipRow label="Страна" value={selectedClient.country || "-"} />
              <UtipRow label="Город" value={selectedClient.city || "-"} />
              <UtipRow label="Адрес" value={selectedClient.address || "-"} />
              <UtipRow label="Роль" value={selectedClient.role} />
            </UtipInfoPanel>

            <UtipInfoPanel title="Управление">
              <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-slate-900">Пароль клиента</p>
                    <p className="text-[11px] text-slate-500">{showClientPassword ? selectedClient.plainPassword || "Доступен после смены пароля" : "••••••••"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClientPassword((value) => !value)}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                  >
                    {showClientPassword ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div>
                  <p className="text-xs font-black text-slate-900">Разрешение торговли</p>
                  <p className="text-[11px] text-slate-500">Новый клиент начинает с запретом</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedClient.tradingEnabled}
                  onClick={() => toggleClientTrading(selectedClient.id, selectedClient.tradingEnabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${selectedClient.tradingEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  title={selectedClient.tradingEnabled ? "Запретить торговлю" : "Разрешить торговлю"}
                >
                  <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${selectedClient.tradingEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
              <label className="text-[11px] font-bold uppercase text-slate-400">Ответственный</label>
              <select className={`${inputClass} h-9 rounded-lg`} value={selectedClient.managerId || ""} onChange={(event) => assignManager(selectedClient.id, event.target.value)}>
                <option value="">Без менеджера</option>
                {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
              </select>
              <label className="mt-3 text-[11px] font-bold uppercase text-slate-400">Депозит</label>
              <div className="flex gap-2">
                <input className={`${inputClass} h-9 rounded-lg`} type="number" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} />
                <button onClick={() => depositToUser(selectedClient.id)} className="rounded-lg bg-emerald-500 px-3 text-xs font-black text-slate-950">OK</button>
              </div>
              <label className="mt-3 text-[11px] font-bold uppercase text-slate-400">Смена пароля</label>
              <div className="flex gap-2">
                <input className={`${inputClass} h-9 rounded-lg`} value={passwords[selectedClient.id] || ""} onChange={(event) => setPasswords({ ...passwords, [selectedClient.id]: event.target.value })} placeholder="Новый пароль" type={showPasswords ? "text" : "password"} />
                <button onClick={() => changeClientPassword(selectedClient.id)} className="rounded-lg bg-slate-900 px-3 text-xs font-black text-white">OK</button>
              </div>
            </UtipInfoPanel>
          </div>}

          {clientSection !== "overview" && (
            <ClientUtipSection
              section={clientSection}
              client={selectedClient}
              trades={clientTrades}
              deposits={clientDeposits}
              withdrawals={clientWithdrawals}
              documents={clientDocs}
              actions={clientActions}
              onCloseTrade={onCloseTrade}
              onUpdateTrade={onUpdateTrade}
              onApproveDeposit={onApproveDeposit}
              onRejectDeposit={onRejectDeposit}
              onUpdateDepositDate={onUpdateDepositDate}
            />
          )}
        </div>

        {clientSection === "overview" && <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Описание">
            <div className="space-y-2 text-sm text-slate-700">
              <p>Сделок: <b>{clientTrades.length}</b></p>
              <p>Выводов: <b>{clientWithdrawals.length}</b></p>
              <p>Документов: <b>{clientDocs.length}</b></p>
              <p>Открытых действий: <b>{clientActions.filter((action) => action.status !== "CLOSED").length}</b></p>
            </div>
          </Panel>
          <Panel title="Заметки">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_auto]">
              <textarea className={`${areaClass} min-h-20 rounded-lg`} placeholder="Заметка по клиенту" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
              <select className={`${inputClass} h-10 rounded-lg`} value={noteStatus} onChange={(event) => setNoteStatus(event.target.value)}>
                <option value="OPEN">Открыто</option>
                <option value="IMPORTANT">Важно</option>
                <option value="CLOSED">Закрыто</option>
              </select>
              <button onClick={addNote} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950">Добавить</button>
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {visibleNotes.map((note) => <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />)}
              {(selectedClient.clientNotes || []).length === 0 && <Empty text="Заметок пока нет" />}
            </div>
            {sortedNotes.length > notePageSize && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button type="button" disabled={notePage <= 1} onClick={() => setNotePage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                  Назад
                </button>
                <span className="text-xs font-black text-slate-500">{notePage} / {notePageCount}</span>
                <button type="button" disabled={notePage >= notePageCount} onClick={() => setNotePage((value) => Math.min(notePageCount, value + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                  Далее
                </button>
              </div>
            )}
          </Panel>
        </div>}

        {clientSection === "overview" && <Panel title="Действия">
          <div className="mb-3 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_190px_150px_150px_190px_auto]">
            <input className={`${inputClass} h-10 rounded-lg`} placeholder="Действие" value={actionForm.title} onChange={(event) => setActionForm({ ...actionForm, title: event.target.value })} />
            <input className={`${inputClass} h-10 rounded-lg`} type="datetime-local" value={actionForm.dueAt} onChange={(event) => setActionForm({ ...actionForm, dueAt: event.target.value })} />
            <select className={`${inputClass} h-10 rounded-lg`} value={actionForm.reminderMinutes} onChange={(event) => setActionForm({ ...actionForm, reminderMinutes: event.target.value })}>
              <option value="">Без напоминания</option>
              <option value="5">За 5 минут</option>
              <option value="15">За 15 минут</option>
              <option value="30">За 30 минут</option>
            </select>
            <select className={`${inputClass} h-10 rounded-lg`} value={actionForm.status} onChange={(event) => setActionForm({ ...actionForm, status: event.target.value })}>
              <option value="OPEN">Открыто</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="POSTPONED">Перенесено</option>
              <option value="CLOSED">Закрыто</option>
            </select>
            <select className={`${inputClass} h-10 rounded-lg`} value={actionForm.managerId} onChange={(event) => setActionForm({ ...actionForm, managerId: event.target.value })}>
              <option value="">Текущий менеджер</option>
              {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
            </select>
            <button onClick={addAction} className="rounded-lg bg-emerald-500 px-4 text-sm font-black text-slate-950">Добавить</button>
          </div>
          <textarea className={`${areaClass} mb-3 min-h-16 rounded-lg`} placeholder="Описание действия" value={actionForm.description} onChange={(event) => setActionForm({ ...actionForm, description: event.target.value })} />
          <UtipActionsTable actions={clientActions} managers={managers} onUpdate={updateAction} />
        </Panel>}

        {clientSection === "overview" && <ClientTimeline client={selectedClient} withdrawals={withdrawals} trades={trades} documents={documents} />}
    </div>
  );
}

function ClientUtipSection({
  section,
  client,
  trades,
  deposits,
  withdrawals,
  documents,
  actions,
  onCloseTrade,
  onUpdateTrade,
  onApproveDeposit,
  onRejectDeposit,
  onUpdateDepositDate,
}: {
  section: "history" | "documents" | "accounts" | "operations" | "deposits" | "requests" | "tickets" | "mailing";
  client: User;
  trades: Trade[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  documents: VerificationDocument[];
  actions: (ClientAction & { client?: User })[];
  onCloseTrade: (trade: Trade) => void;
  onUpdateTrade: (tradeId: string, payload: TradeUpdatePayload) => void;
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  onUpdateDepositDate: (depositId: string, createdAt: string) => void;
}) {
  const accountNumber = clientDisplayNumber(client);
  const closedTrades = trades.filter((trade) => trade.closePrice !== null);
  const openTrades = trades.filter((trade) => trade.closePrice === null);
  const historyEvents = [
    { id: `created-${client.id}`, date: client.createdAt, author: "Система", text: `Создан клиент ${displayName(client)}` },
    ...trades.map((trade) => ({
      id: `trade-${trade.id}`,
      date: trade.createdAt,
      author: "Терминал",
      text: `${trade.closePrice === null ? "Открыта позиция" : "Закрыта сделка"} ${trade.side} ${trade.symbol}, объем ${trade.volume}`,
    })),
    ...deposits.map((deposit) => ({
      id: `deposit-${deposit.id}`,
      date: deposit.createdAt,
      author: "Финансы",
      text: `Пополнение счета на €${Number(deposit.amount).toFixed(2)} (${deposit.status})`,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: `withdrawal-${withdrawal.id}`,
      date: withdrawal.createdAt,
      author: "Финансы",
      text: `Заявка на вывод €${Number(withdrawal.amount).toFixed(2)} (${withdrawal.status})`,
    })),
    ...documents.map((doc) => ({
      id: `doc-${doc.id}`,
      date: doc.createdAt,
      author: "Верификация",
      text: `${doc.documentType || "Документ"}: ${doc.status}`,
    })),
    ...actions.map((action) => ({
      id: `action-${action.id}`,
      date: action.createdAt,
      author: action.manager ? displayName(action.manager) : "CRM",
      text: `Действие: ${action.title} (${action.status})`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (section === "history") {
    return (
      <UtipTable title="История клиента">
        <thead>
          <tr>
            <UtipTh>Автор</UtipTh>
            <UtipTh>Дата</UtipTh>
            <UtipTh>Описание</UtipTh>
          </tr>
        </thead>
        <tbody>
          {historyEvents.map((event) => (
            <tr key={event.id} className="border-b border-slate-100 hover:bg-emerald-50/40">
              <UtipTd>{event.author}</UtipTd>
              <UtipTd>{new Date(event.date).toLocaleString("ru-RU")}</UtipTd>
              <UtipTd>{event.text}</UtipTd>
            </tr>
          ))}
        </tbody>
      </UtipTable>
    );
  }

  if (section === "documents") {
    return (
      <UtipTable title="Документы">
        <thead>
          <tr>
            <UtipTh>Тип</UtipTh>
            <UtipTh>Файл</UtipTh>
            <UtipTh>Статус</UtipTh>
            <UtipTh>Дата</UtipTh>
            <UtipTh>Действие</UtipTh>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-slate-100">
              <UtipTd>{doc.documentType || "Документ"}</UtipTd>
              <UtipTd>{doc.fileName}</UtipTd>
              <UtipTd><Badge value={doc.status} /></UtipTd>
              <UtipTd>{new Date(doc.createdAt).toLocaleString("ru-RU")}</UtipTd>
              <UtipTd>
                <a href={`/api/admin/verification/${doc.id}/view`} target="_blank" rel="noopener noreferrer" className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">
                  Открыть
                </a>
              </UtipTd>
            </tr>
          ))}
          {documents.length === 0 && <UtipEmptyRow colSpan={5} text="Документов пока нет" />}
        </tbody>
      </UtipTable>
    );
  }

  if (section === "accounts") {
    return (
      <UtipTable title="Торговые счета">
        <thead>
          <tr>
            <UtipTh>Номер счета</UtipTh>
            <UtipTh>Тип счета</UtipTh>
            <UtipTh>Средства</UtipTh>
            <UtipTh>Бонусы</UtipTh>
            <UtipTh>Разрешение торговли</UtipTh>
            <UtipTh>Открытые позиции</UtipTh>
            <UtipTh>Закрытые сделки</UtipTh>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <UtipTd>{accountNumber}</UtipTd>
            <UtipTd>ASTERO EUR Live</UtipTd>
            <UtipTd>€{Number(client.balance || 0).toFixed(2)}</UtipTd>
            <UtipTd>0.00</UtipTd>
            <UtipTd><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></UtipTd>
            <UtipTd>{openTrades.length}</UtipTd>
            <UtipTd>{closedTrades.length}</UtipTd>
          </tr>
        </tbody>
      </UtipTable>
    );
  }

  if (section === "operations") {
    return (
      <TradingOperationsDesk
        clients={[client]}
        trades={trades}
        onClose={onCloseTrade}
        onUpdate={onUpdateTrade}
        title={`Торговые операции: ${displayName(client)}`}
        compact
      />
    );
  }

  if (section === "deposits") {
    return (
      <UtipTable title="Депозиты">
        <thead>
          <tr>
            <UtipTh>Счет</UtipTh>
            <UtipTh>Дата</UtipTh>
            <UtipTh>Сумма</UtipTh>
            <UtipTh>Метод</UtipTh>
            <UtipTh>Статус</UtipTh>
            <UtipTh>Действие</UtipTh>
          </tr>
        </thead>
        <tbody>
          {deposits.map((deposit) => (
            <tr key={deposit.id} className="border-b border-slate-100">
              <UtipTd>{accountNumber}</UtipTd>
              <UtipTd><input type="datetime-local" className="h-9 rounded border border-slate-200 px-2 text-xs" defaultValue={toLocalDateTime(deposit.createdAt)} onBlur={(event) => event.target.value && onUpdateDepositDate(deposit.id, event.target.value)} /></UtipTd>
              <UtipTd>${Number(deposit.amount).toFixed(2)}</UtipTd>
              <UtipTd>{deposit.method || "-"}</UtipTd>
              <UtipTd><Badge value={deposit.status} /></UtipTd>
              <UtipTd>
                {deposit.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveDeposit(deposit.id)}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700"
                    >
                      Подтвердить
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectDeposit(deposit.id)}
                      className="rounded bg-red-500 px-3 py-1.5 text-xs font-black text-white hover:bg-red-600"
                    >
                      Отклонить
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Обработано</span>
                )}
              </UtipTd>
            </tr>
          ))}
          {deposits.length === 0 && <UtipEmptyRow colSpan={6} text="Пополнений пока нет" />}
        </tbody>
      </UtipTable>
    );
  }

  if (false && section === "deposits") {
    return (
      <UtipTable title="Депозиты">
        <thead>
          <tr>
            <UtipTh>Счет</UtipTh>
            <UtipTh>Дата</UtipTh>
            <UtipTh>Сумма</UtipTh>
            <UtipTh>Метод</UtipTh>
            <UtipTh>Статус</UtipTh>
          </tr>
        </thead>
        <tbody>
          {deposits.map((deposit) => (
            <tr key={deposit.id} className="border-b border-slate-100">
              <UtipTd>{accountNumber}</UtipTd>
              <UtipTd>{new Date(deposit.createdAt).toLocaleString("ru-RU")}</UtipTd>
              <UtipTd>${Number(deposit.amount).toFixed(2)}</UtipTd>
              <UtipTd>{deposit.method || "-"}</UtipTd>
              <UtipTd><Badge value={deposit.status} /></UtipTd>
            </tr>
          ))}
          {deposits.length === 0 && <UtipEmptyRow colSpan={5} text="Пополнений пока нет" />}
        </tbody>
      </UtipTable>
    );
  }

  if (section === "requests") {
    return (
      <UtipTable title="Заявки">
        <thead>
          <tr>
            <UtipTh>Номер</UtipTh>
            <UtipTh>Дата</UtipTh>
            <UtipTh>Тип</UtipTh>
            <UtipTh>Счет</UtipTh>
            <UtipTh>Сумма</UtipTh>
            <UtipTh>Статус</UtipTh>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((withdrawal, index) => (
            <tr key={withdrawal.id} className="border-b border-slate-100">
              <UtipTd>{index + 1}</UtipTd>
              <UtipTd>{new Date(withdrawal.createdAt).toLocaleString("ru-RU")}</UtipTd>
              <UtipTd>Вывод</UtipTd>
              <UtipTd>{accountNumber}</UtipTd>
              <UtipTd>${Number(withdrawal.amount).toFixed(2)}</UtipTd>
              <UtipTd><Badge value={withdrawal.status} /></UtipTd>
            </tr>
          ))}
          {withdrawals.length === 0 && <UtipEmptyRow colSpan={6} text="Заявок пока нет" />}
        </tbody>
      </UtipTable>
    );
  }

  if (section === "tickets") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <h3 className="text-lg font-black text-slate-950">Тикеты</h3>
        <p className="mt-2">Тикеты клиента подключены через общую вкладку поддержки CRM. История обращений сохраняется в разделе «Поддержка».</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <h3 className="text-lg font-black text-slate-950">Рассылка</h3>
      <p className="mt-2">Раздел подготовлен для будущих email/SMS-кампаний по клиенту. Текущие контакты: {client.email}</p>
    </div>
  );
}

function UtipTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-xs">{children}</table>
      </div>
    </div>
  );
}

function UtipTh({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-black uppercase text-slate-500">{children}</th>;
}

function UtipTd({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-slate-800">{children}</td>;
}

function UtipEmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td className="px-3 py-8 text-center text-slate-500" colSpan={colSpan}>{text}</td>
    </tr>
  );
}

function UtipInfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <h3 className="mb-2 text-sm font-black text-slate-950">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function UtipRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid grid-cols-[130px_1fr] border-b border-slate-200 py-1.5 text-xs last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-2 break-words font-bold text-slate-900">
        <span>{value}</span>
        {copyValue && (
          <button
            type="button"
            title="Копировать номер телефона"
            onClick={async () => {
              await navigator.clipboard.writeText(copyValue);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            className="shrink-0 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-50"
          >
            {copied ? "Скопировано" : "⧉ Копировать"}
          </button>
        )}
      </span>
    </div>
  );
}

function UtipActionsTable({
  actions,
  managers,
  onUpdate,
}: {
  actions: (ClientAction & { client?: User })[];
  managers: User[];
  onUpdate: (id: string, payload: Partial<{ title: string; description: string; status: string; dueAt: string; managerId: string; reminderMinutes: number | null }>) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-[1220px] w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <th className="px-3 py-2">Дата</th>
            <th className="px-3 py-2">Тип</th>
            <th className="px-3 py-2">Создатель</th>
            <th className="px-3 py-2">Описание</th>
            <th className="px-3 py-2">Напоминание</th>
            <th className="px-3 py-2">Ответственный</th>
            <th className="px-3 py-2">Статус</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action.id} className="border-b border-slate-100 align-top text-slate-800 hover:bg-slate-50">
              <td className="px-3 py-2"><input type="datetime-local" className="h-10 rounded border border-slate-200 px-3" defaultValue={toLocalDateTime(action.dueAt)} onBlur={(event) => event.target.value && onUpdate(action.id, { dueAt: event.target.value })} /></td>
              <td className="px-3 py-2"><input className="h-10 w-44 rounded border border-slate-200 px-3 font-black" defaultValue={action.title} onBlur={(event) => event.target.value.trim() && event.target.value !== action.title && onUpdate(action.id, { title: event.target.value })} /></td>
              <td className="px-3 py-2">{action.manager ? displayName(action.manager) : "-"}</td>
              <td className="px-3 py-2"><input className="h-10 w-64 rounded border border-slate-200 px-3" defaultValue={action.description || ""} onBlur={(event) => event.target.value !== (action.description || "") && onUpdate(action.id, { description: event.target.value })} /></td>
              <td className="px-3 py-2">
                <select className="h-10 w-40 rounded border border-slate-200 px-3 text-sm" value={action.reminderMinutes ? String(action.reminderMinutes) : ""} onChange={(event) => onUpdate(action.id, { reminderMinutes: event.target.value ? Number(event.target.value) : null })}>
                  <option value="">Нет</option>
                  <option value="5">За 5 минут</option>
                  <option value="15">За 15 минут</option>
                  <option value="30">За 30 минут</option>
                </select>
              </td>
              <td className="px-3 py-2">
                <select className="h-10 w-48 rounded border border-slate-200 px-3 text-sm" value={action.manager?.id || ""} onChange={(event) => onUpdate(action.id, { managerId: event.target.value })}>
                  <option value="">Без менеджера</option>
                  {managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">
                <select className="h-10 rounded border border-slate-200 px-3 text-sm" value={action.status} onChange={(event) => onUpdate(action.id, { status: event.target.value })}>
                  <option value="OPEN">Открыто</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="POSTPONED">Перенесено</option>
                  <option value="CLOSED">Закрыто</option>
                </select>
              </td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => onUpdate(action.id, { status: "CLOSED" })} className="rounded bg-emerald-600 px-4 py-2 font-black text-white">Закрыть</button>
              </td>
            </tr>
          ))}
          {actions.length === 0 && (
            <tr>
              <td className="px-3 py-8 text-center text-slate-500" colSpan={8}>Действий нет</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClientsTable({
  clients,
  managers,
  onAssign,
  onOpen,
  onBlock,
  onDelete,
}: {
  clients: User[];
  managers: User[];
  onAssign: (userId: string, managerId: string) => void;
  onOpen: (client: User) => void;
  onBlock: (client: User) => void;
  onDelete: (client: User) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[1280px] w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase text-slate-500">
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Клиент</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Телефон</th>
            <th className="px-3 py-2">Страна</th>
            <th className="px-3 py-2">Баланс</th>
            <th className="px-3 py-2">Дата создания</th>
            <th className="px-3 py-2">Статус</th>
            <th className="px-3 py-2">Менеджер</th>
            <th className="px-3 py-2 text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, index) => (
            <tr key={client.id} className="border-b border-slate-100 text-slate-800 hover:bg-emerald-50/50">
              <td className="px-3 py-2 font-mono text-[11px] text-slate-500"><span className="inline-flex items-center gap-1">{clientDisplayNumber(client)}<button type="button" title="Копировать номер" onClick={() => navigator.clipboard.writeText(clientDisplayNumber(client))} className="rounded px-1 text-emerald-700 hover:bg-emerald-100">⧉</button></span></td>
              <td className="px-3 py-2">
                <a href={`/crm?tab=clientCard&clientId=${encodeURIComponent(client.id)}`} onClick={(event) => { event.preventDefault(); onOpen(client); }} className="text-left font-black text-slate-950 hover:text-emerald-700">
                  {displayName(client)}
                </a>
                <p className="text-[11px] text-slate-400">#{index + 1}</p>
              </td>
              <td className="px-3 py-2">{client.email}</td>
              <td className="px-3 py-2">{client.phone || "-"}</td>
              <td className="px-3 py-2">{client.country || "-"}</td>
              <td className="px-3 py-2 font-black text-emerald-700">€{Number(client.balance || 0).toFixed(2)}</td>
              <td className="px-3 py-2">{new Date(client.createdAt).toLocaleDateString("ru-RU")}</td>
              <td className="px-3 py-2"><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></td>
              <td className="px-3 py-2">
                <select
                  className="h-8 w-44 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
                  value={client.managerId || ""}
                  onChange={(event) => onAssign(client.id, event.target.value)}
                >
                  <option value="">Не назначен</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{displayName(manager)}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-2">
                  <a href={`/crm?tab=clientCard&clientId=${encodeURIComponent(client.id)}`} onClick={(event) => { event.preventDefault(); onOpen(client); }} className="rounded bg-slate-950 px-2 py-1.5 font-black text-white">Открыть</a>
                </div>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td className="px-3 py-8 text-center text-slate-500" colSpan={10}>
                Клиенты не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClientListCard({ client, managers, onAssign, onOpen, onBlock, onDelete }: { client: User; managers: User[]; onAssign: (userId: string, managerId: string) => void; onOpen: () => void; onBlock: () => void; onDelete: () => void }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-black text-slate-950">{displayName(client)}</p><p className="text-sm text-slate-500">{client.email}</p><p className="mt-1 text-xs text-slate-500">{client.phone || "-"} · {client.country || "-"}</p></div><div className="flex flex-wrap gap-2"><Badge value={client.kycStatus} /><Badge value={client.isBlocked ? "BLOCKED" : "ACTIVE"} /></div></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><select className={inputClass} value={client.managerId || ""} onChange={(e) => onAssign(client.id, e.target.value)}><option value="">Не назначен</option>{managers.map((m) => <option key={m.id} value={m.id}>{displayName(m)}</option>)}</select><p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">${Number(client.balance).toFixed(2)}</p></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={onOpen} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Открыть карточку</button><button onClick={onBlock} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white">{client.isBlocked ? "Разблокировать" : "Заблокировать"}</button><button onClick={onDelete} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white">Удалить</button></div></div>;
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl border border-emerald-100 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>;
}

function NoteCard({ note, onUpdate, onDelete }: { note: ClientNote; onUpdate: (id: string, payload: Partial<{ status: string; text: string }>) => void; onDelete: (id: string) => void }) {
  const [text, setText] = useState(note.text);
  const isImportant = note.status === "IMPORTANT";
  return <div className={`rounded-xl border p-3 ${isImportant ? "border-amber-300 bg-amber-50" : "border-emerald-100 bg-white"}`}><div className="grid gap-2 sm:grid-cols-[1fr_130px_auto_auto]"><textarea className={`min-h-16 rounded-lg border px-3 py-2 text-slate-700 outline-none focus:border-emerald-500 ${isImportant ? "border-amber-200 bg-white text-base font-black text-amber-900" : "border-slate-200 text-sm"}`} value={text} onChange={(event) => setText(event.target.value)} /><select className="h-10 rounded-lg border border-emerald-100 px-2 text-xs" value={note.status} onChange={(event) => onUpdate(note.id, { status: event.target.value })}><option value="OPEN">Открыто</option><option value="IMPORTANT">Важно</option><option value="CLOSED">Закрыто</option></select><button onClick={() => onUpdate(note.id, { text })} disabled={!text.trim() || text === note.text} className="h-10 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-40">Сохранить</button><button type="button" onClick={() => onDelete(note.id)} className="h-10 rounded-lg bg-red-50 px-3 text-xs font-black text-red-700 hover:bg-red-100">Удалить</button></div><p className={`mt-2 text-[11px] ${isImportant ? "font-black text-amber-700" : "text-slate-400"}`}>{isImportant ? "Важно · " : "Изменено: "}{new Date(note.updatedAt || note.createdAt).toLocaleString("ru-RU")}</p></div>;
}

function ActionList({ actions, onUpdate, managers, showClient, onOpenClient }: { actions: (ClientAction & { client?: User })[]; onUpdate: (id: string, payload: Partial<{ title: string; description: string; status: string; dueAt: string; managerId: string }>) => void; managers: User[]; showClient?: boolean; onOpenClient?: (client: User) => void }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1050px] text-xs"><thead><tr className="bg-slate-50 text-left text-slate-500"><th className="px-2 py-2">Клиент</th><th className="px-2 py-2">Действие</th><th className="px-2 py-2">Описание</th><th className="px-2 py-2">Срок</th><th className="px-2 py-2">Ответственный</th><th className="px-2 py-2">Статус</th><th className="px-2 py-2" /></tr></thead><tbody>{actions.map((action) => <tr key={action.id} className="border-t border-slate-100 align-middle"><td className="px-2 py-1.5">{showClient && action.client ? <button onClick={() => onOpenClient?.(action.client!)} className="text-left font-black text-emerald-700 hover:underline"><span className="block">{displayName(action.client)}</span><span className="font-normal text-slate-500">{action.client.email}</span></button> : "-"}</td><td className="px-2 py-1.5"><input defaultValue={action.title} onBlur={(event) => event.target.value.trim() && event.target.value !== action.title && onUpdate(action.id, { title: event.target.value })} className="h-8 w-44 rounded border border-slate-200 px-2" /></td><td className="px-2 py-1.5"><input defaultValue={action.description || ""} onBlur={(event) => event.target.value !== (action.description || "") && onUpdate(action.id, { description: event.target.value })} className="h-8 w-56 rounded border border-slate-200 px-2" /></td><td className="px-2 py-1.5"><input type="datetime-local" className="h-8 rounded border border-slate-200 px-2" defaultValue={toLocalDateTime(action.dueAt)} onBlur={(event) => event.target.value && onUpdate(action.id, { dueAt: event.target.value })} /></td><td className="px-2 py-1.5"><select className="h-8 w-40 rounded border border-slate-200 px-2" value={action.manager?.id || ""} onChange={(event) => onUpdate(action.id, { managerId: event.target.value })}><option value="">Без менеджера</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{displayName(manager)}</option>)}</select></td><td className="px-2 py-1.5"><select className="h-8 rounded border border-slate-200 px-2" value={action.status} onChange={(event) => onUpdate(action.id, { status: event.target.value })}><option value="OPEN">Открыто</option><option value="IN_PROGRESS">В работе</option><option value="POSTPONED">Перенесено</option><option value="CLOSED">Закрыто</option></select></td><td className="px-2 py-1.5"><button onClick={() => onUpdate(action.id, { status: "CLOSED" })} className="rounded bg-emerald-600 px-2 py-1.5 font-black text-white">Закрыть</button></td></tr>)}{actions.length === 0 && <tr><td colSpan={7} className="p-5 text-center text-slate-500">Действий нет</td></tr>}</tbody></table></div>;
}

function TradingOperationsDesk({
  clients,
  trades,
  onClose,
  onUpdate,
  title = "Торговые операции",
  compact = false,
}: {
  clients: User[];
  trades: Trade[];
  onClose: (trade: Trade) => void;
  onUpdate: (tradeId: string, payload: TradeUpdatePayload) => void;
  title?: string;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"open" | "closed" | "all">("open");
  const [account, setAccount] = useState("all");
  const [symbol, setSymbol] = useState(() => readSessionValue("astero.crm.tradeSearch"));
  const [side, setSide] = useState("all");
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [quotes, setQuotes] = useState<Record<string, { price: number; bid: number; ask: number; tickValue?: number | null }>>({});
  const [page, setPage] = useState(1);

  const openQuoteSymbols = useMemo(
    () => Array.from(new Set(trades.filter((trade) => trade.closePrice === null).map((trade) => trade.symbol))),
    [trades]
  );
  const openQuoteSymbolsKey = openQuoteSymbols.join("|");

  useEffect(() => {
    sessionStorage.setItem("astero.crm.tradeSearch", symbol);
  }, [symbol]);

  const clientMap = useMemo(() => {
    const map = new Map<string, User>();
    clients.forEach((client) => {
      map.set(client.id, client);
      map.set(client.email, client);
    });
    return map;
  }, [clients]);

  const filteredTrades = useMemo(() => {
    const query = symbol.trim().toLowerCase();

    return trades.filter((trade) => {
      const client = clientMap.get(trade.user.id || "") || clientMap.get(trade.user.email);
      const isOpen = trade.closePrice === null;
      const matchesMode = mode === "all" || (mode === "open" && isOpen) || (mode === "closed" && !isOpen);
      const matchesAccount = account === "all" || client?.id === account || trade.user.id === account;
      const matchesSide = side === "all" || trade.side === side;
      const matchesQuery =
        query === "" ||
        `${trade.symbol} ${trade.user.email} ${displayName(trade.user)} ${client ? displayName(client) : ""}`.toLowerCase().includes(query);

      return matchesMode && matchesAccount && matchesSide && matchesQuery;
    });
  }, [account, clientMap, mode, side, symbol, trades]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const pagedTrades = filteredTrades.slice((page - 1) * pageSize, page * pageSize);
  const selectedTrade = filteredTrades.find((trade) => trade.id === selectedTradeId) || filteredTrades[0];
  const openCount = trades.filter((trade) => trade.closePrice === null).length;
  const closedCount = trades.length - openCount;
  const filteredProfit = filteredTrades.reduce((sum, trade) => sum + getTradeProfit(trade), 0);

  useEffect(() => {
    setPage(1);
  }, [account, mode, side, symbol]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      const entries = await Promise.all(
        openQuoteSymbols.map(async (quoteSymbol) => {
          try {
            const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(quoteSymbol)}`, { cache: "no-store" });
            if (!res.ok) return null;

            const data = await res.json();
            const price = Number(data.price);
            const bid = Number(data.bid ?? data.price);
            const ask = Number(data.ask ?? data.price);

            if (!Number.isFinite(price) || !Number.isFinite(bid) || !Number.isFinite(ask)) return null;

            return [quoteSymbol, { price, bid, ask, tickValue: data.settings?.tickValue ?? null }] as const;
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setQuotes(Object.fromEntries(entries.filter((entry) => entry !== null)));
      }
    }

    if (openQuoteSymbols.length === 0) {
      setQuotes({});
      return;
    }

    loadQuotes();
    const interval = window.setInterval(loadQuotes, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [openQuoteSymbolsKey]);

  function getTradeClosePrice(trade: Trade) {
    if (trade.closePrice !== null) return trade.closePrice;

    const quote = quotes[trade.symbol];
    if (!quote) return trade.openPrice;

    return trade.side === "BUY" ? quote.bid : quote.ask;
  }

  function getTradeProfit(trade: Trade) {
    if (trade.closePrice !== null) return Number(trade.profit || 0);

    return calculateTradeProfit(
      trade.symbol,
      trade.side,
      trade.openPrice,
      getTradeClosePrice(trade),
      trade.volume,
      trade.swap || 0,
      quotes[trade.symbol]?.tickValue
    );
  }

  function resetFilters() {
    setMode("open");
    setAccount("all");
    setSymbol("");
    setSide("all");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-white p-4 text-slate-950 shadow-sm">
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {clients.length === 1 ? "Операции выбранного клиента" : "Операции по всем клиентам CRM"}
        </p>
      </div>

      <div className={`grid grid-cols-2 gap-3 ${compact ? "xl:grid-cols-4" : "xl:grid-cols-4"}`}>
        <Metric title="Открытые позиции" value={openCount} />
        <Metric title="Закрытые сделки" value={closedCount} />
        <Metric title="В выборке" value={filteredTrades.length} />
        <Metric title="Итог по выборке" value={`€${filteredProfit.toFixed(2)}`} danger={filteredProfit < 0} />
      </div>

      <section className="rounded-xl border border-emerald-100 bg-white text-slate-950 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["open", "Открытые позиции и ордера"],
              ["closed", "Закрытые сделки"],
              ["all", "Все операции"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key as typeof mode)}
                className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                  mode === key ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_180px_1fr_auto_auto]">
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500" value={account} onChange={(event) => setAccount(event.target.value)}>
              <option value="all">Все счета</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.id.slice(-6).toUpperCase()} · {displayName(client)}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500" value={side} onChange={(event) => setSide(event.target.value)}>
              <option value="all">Все типы</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input name="crm-trade-search" autoComplete="off" autoCorrect="off" spellCheck={false} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500" placeholder="Поиск: символ, клиент, email" value={symbol} onChange={(event) => setSymbol(event.target.value)} />
            <button type="button" className="rounded-lg bg-emerald-600 px-4 text-xs font-black text-white">Показать</button>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600">Сбросить</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`${compact ? "min-w-[1320px]" : "min-w-[1540px]"} w-full text-xs`}>
            <thead>
              <tr className="border-b border-slate-200 bg-white text-left text-[11px] uppercase text-slate-500">
                <th className="px-3 py-2">Счет</th>
                <th className="px-3 py-2">Клиент</th>
                <th className="px-3 py-2">Символ</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Объем</th>
                <th className="px-3 py-2">Дата открытия</th>
                <th className="px-3 py-2">Дата закрытия</th>
                <th className="px-3 py-2">Цена открытия</th>
                <th className="px-3 py-2">Текущая/закрытия</th>
                <th className="px-3 py-2">Take Profit</th>
                <th className="px-3 py-2">Stop Loss</th>
                <th className="px-3 py-2">Swap</th>
                <th className="px-3 py-2">Прибыль</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {pagedTrades.map((trade) => {
                const client = clientMap.get(trade.user.id || "") || clientMap.get(trade.user.email);
                const isOpen = trade.closePrice === null;

                return (
                  <tr
                    key={trade.id}
                    onClick={() => setSelectedTradeId(trade.id)}
                    className={`cursor-pointer border-b border-slate-100 align-top hover:bg-emerald-50/60 ${selectedTrade?.id === trade.id ? "bg-emerald-50" : ""}`}
                  >
                    <td className="px-3 py-2 font-mono text-[11px]">{(client?.id || trade.user.id || trade.id).slice(-6).toUpperCase()}</td>
                    <td className="px-3 py-2">
                      <p className="font-black">{client ? displayName(client) : displayName(trade.user)}</p>
                      <p className="text-[11px] text-slate-500">{trade.user.email}</p>
                    </td>
                    <td className="px-3 py-2 font-black">{trade.symbol}</td>
                    <td className={`px-3 py-2 font-black ${trade.side === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{trade.side}</td>
                    <td className="px-3 py-2">
                      {isOpen ? <TradeEditInput label="Объем" value={trade.volume} step="0.01" onCommit={(value) => onUpdate(trade.id, { volume: value ?? trade.volume })} /> : trade.volume}
                    </td>
                    <td className="px-3 py-2">{new Date(trade.createdAt).toLocaleString("ru-RU")}</td>
                    <td className="px-3 py-2">{trade.closedAt ? new Date(trade.closedAt).toLocaleString("ru-RU") : "-"}</td>
                    <td className="px-3 py-2">
                      {isOpen ? <TradeEditInput label="Цена открытия" value={trade.openPrice} onCommit={(value) => onUpdate(trade.id, { openPrice: value ?? trade.openPrice })} /> : formatPrice(trade.symbol, trade.openPrice)}
                    </td>
                    <td className="px-3 py-2">{formatPrice(trade.symbol, getTradeClosePrice(trade))}</td>
                    <td className="px-3 py-2">
                      {isOpen ? <TradeEditInput label="Take Profit" value={trade.takeProfit} allowEmpty onCommit={(value) => onUpdate(trade.id, { takeProfit: value })} /> : trade.takeProfit == null ? "-" : formatPrice(trade.symbol, trade.takeProfit)}
                    </td>
                    <td className="px-3 py-2">
                      {isOpen ? <TradeEditInput label="Stop Loss" value={trade.stopLoss} allowEmpty onCommit={(value) => onUpdate(trade.id, { stopLoss: value })} /> : trade.stopLoss == null ? "-" : formatPrice(trade.symbol, trade.stopLoss)}
                    </td>
                    <td className="px-3 py-2">
                      {isOpen ? <TradeEditInput label="Swap" value={trade.swap ?? 0} step="0.01" allowNegative onCommit={(value) => onUpdate(trade.id, { swap: value ?? 0 })} /> : Number(trade.swap || 0).toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 font-black ${getTradeProfit(trade) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {isOpen ? (
                        `€${getTradeProfit(trade).toFixed(2)}`
                      ) : (
                        <TradeEditInput
                          label="Profit"
                          value={getTradeProfit(trade)}
                          step="0.01"
                          allowNegative
                          onCommit={(value) => value !== null && onUpdate(trade.id, { profit: value })}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2"><Badge value={isOpen ? "OPEN" : "CLOSED"} /></td>
                    <td className="px-3 py-2 text-right">
                      {isOpen ? (
                        <button onClick={(event) => { event.stopPropagation(); onClose(trade); }} className="rounded bg-red-600 px-3 py-1.5 font-black text-white">Закрыть</button>
                      ) : (
                        <span className="text-slate-400">Закрыта</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTrades.length === 0 && (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={15}>По выбранным фильтрам ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-3 xl:flex-row xl:items-center xl:justify-between">
          {selectedTrade ? (
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
              <MiniCell label="Символ" value={selectedTrade.symbol} />
              <MiniCell label="Номер" value={selectedTrade.id.slice(-8).toUpperCase()} />
              <MiniCell label="Тип" value={selectedTrade.side} />
              <MiniCell label="Объем" value={String(selectedTrade.volume)} />
              <MiniCell label="Open price" value={formatPrice(selectedTrade.symbol, selectedTrade.openPrice)} />
              <MiniCell label="Profit" value={`€${getTradeProfit(selectedTrade).toFixed(2)}`} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Выберите операцию в таблице</p>
          )}
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
              Назад
            </button>
            <span className="text-xs font-black text-slate-500">
              {page} / {pageCount}
            </span>
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
              Далее
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate font-black text-slate-900">{value}</p>
    </div>
  );
}


function SupportPanel({
  clients,
  messages,
  error,
  unreadIds = new Set<string>(),
  selectedClientId,
  setSelectedClientId,
  onReadClient,
  text,
  setText,
  onSend,
}: {
  clients: User[];
  messages: SupportMessage[];
  error: string;
  unreadIds?: Set<string>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  onReadClient: (id: string) => void;
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
      {error && (
        <div className="xl:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <Panel title="Диалоги поддержки">
        <div className="max-h-[650px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {clientsWithMessages.map(({ client, count, last }) => (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={`w-full px-3 py-2 text-left transition ${
                selectedClientId === client.id
                  ? "bg-emerald-50"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-black text-slate-950">
                    {unreadIds.has(client.id) && <span className="size-2.5 rounded-full bg-red-500" />}
                    {displayName(client)}
                  </p>
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
                      className={`max-w-[96%] rounded-2xl px-4 py-3 text-sm xl:max-w-[78%] ${
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

function SupportPanelV2({
  clients,
  messages,
  conversations,
  error,
  unreadIds,
  selectedClientId,
  setSelectedClientId,
  onReadClient,
  text,
  setText,
  attachment,
  setAttachment,
  onAttach,
  onSend,
  onClose,
  onDeleteArchive,
  onEditMessage,
}: {
  clients: User[];
  messages: SupportMessage[];
  conversations: SupportConversation[];
  error: string;
  unreadIds: Set<string>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  onReadClient: (id: string) => void;
  text: string;
  setText: (text: string) => void;
  attachment: AttachmentPayload | null;
  setAttachment: (attachment: AttachmentPayload | null) => void;
  onAttach: (file: File | null) => void;
  onSend: () => void;
  onClose: (userId: string) => void;
  onDeleteArchive: (userId: string) => void;
  onEditMessage: (messageId: string, message: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportMode, setSupportMode] = useState<"open" | "archive">("open");
  const [supportSearch, setSupportSearch] = useState(() => readSessionValue("astero.crm.supportSearch"));
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingText, setEditingText] = useState("");
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedConversation = conversations.find((item) => item.userId === selectedClientId);
  const dialog = messages
    .filter((message) => message.userId === selectedClientId)
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const clientsWithMessages = clients
    .map((client) => ({
      client,
      count: messages.filter((message) => message.userId === client.id).length,
      conversation: conversations.find((item) => item.userId === client.id),
      last: messages
        .filter((message) => message.userId === client.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    }))
    .filter((item) => item.count > 0 || item.conversation)
    .filter((item) => supportMode === "archive" ? item.conversation?.status === "CLOSED" : item.conversation?.status !== "CLOSED")
    .sort((a, b) => new Date(b.last?.createdAt || 0).getTime() - new Date(a.last?.createdAt || 0).getTime());
  const supportSearchResults = clients.filter((client) => {
    const query = supportSearch.trim().toLowerCase();
    if (!query) return true;
    return `${client.id} ${client.email} ${client.firstName || ""} ${client.lastName || ""} ${client.phone || ""}`
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    sessionStorage.setItem("astero.crm.supportSearch", supportSearch);
  }, [supportSearch]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      {error && (
        <div className="xl:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <Panel title="Диалоги поддержки">
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {([
            ["open", "Диалоги"],
            ["archive", "Архив"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSupportMode(key);
                setSelectedClientId("");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-black transition ${supportMode === key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen((current) => !current)}
          className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white hover:bg-emerald-700"
        >
          <span aria-hidden="true">⌕</span> Поиск клиента
        </button>
        {searchOpen && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
            <input
              autoFocus
              name="crm-support-client-search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
              value={supportSearch}
              onChange={(event) => setSupportSearch(event.target.value)}
              placeholder="ID, имя, фамилия, email или телефон"
            />
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
              {supportSearchResults.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    setSelectedClientId(client.id);
                    onReadClient(client.id);
                    setSearchOpen(false);
                  }}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-emerald-50"
                >
                  <span className="block text-sm font-black text-slate-900">{displayName(client)}</span>
                  <span className="block text-xs text-slate-500">{client.email} · {client.phone || "без телефона"}</span>
                </button>
              ))}
              {supportSearchResults.length === 0 && <p className="p-3 text-sm text-slate-500">Клиент не найден</p>}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {clientsWithMessages.map(({ client, count, conversation, last }) => (
            <button
              key={client.id}
              onClick={() => {
                setSelectedClientId(client.id);
                onReadClient(client.id);
              }}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selectedClientId === client.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-emerald-100 bg-white hover:bg-emerald-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-black text-slate-950">
                    {unreadIds.has(client.id) && <span className="size-2.5 rounded-full bg-red-500" />}
                    {displayName(client)}
                  </p>
                  <p className="text-xs text-slate-500">{client.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                  {count}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2"><p className="truncate text-xs text-slate-500">{last?.message || (last?.attachmentName ? "Файл" : "Сообщений пока нет")}</p><Badge value={conversation?.status || "OPEN"} /></div>
              {supportMode === "archive" && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteArchive(client.id);
                  }}
                  className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100"
                >
                  Удалить из архива
                </button>
              )}
            </button>
          ))}

          {clientsWithMessages.length === 0 && <Empty text="Клиентов пока нет" />}
        </div>
      </Panel>

      <Panel title={selectedClient ? `Чат: ${displayName(selectedClient)}` : "Чат поддержки"}>
        {!selectedClient ? (
          <Empty text="Выберите клиента слева" />
        ) : (
          <div className="flex h-[650px] min-h-0 flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">Статус обращения</span>
                <Badge value={selectedConversation?.status || "OPEN"} />
              </div>
              <button
                type="button"
                onClick={() => onClose(selectedClient.id)}
                disabled={selectedConversation?.status === "CLOSED"}
                className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Закрыть обращение
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-emerald-100 bg-slate-50 p-3">
              {dialog.map((message) => {
                const isBot = message.sender === "BOT" || message.fromRole === "BOT";
                const isManager = message.sender === "MANAGER" || message.fromRole === "MANAGER";
                const isAdmin = message.sender === "ADMIN" || message.fromRole === "ADMIN";
                const isStaff = isAdmin || isManager;
                const authorLabel = isBot ? "Бот" : isManager ? "Менеджер" : isAdmin ? "Администратор" : "Клиент";
                const attachmentUrl = message.attachmentBase64 && message.attachmentMimeType
                  ? `data:${message.attachmentMimeType};base64,${message.attachmentBase64}`
                  : "";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isStaff ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        isManager
                          ? "bg-emerald-600 text-white"
                          : isAdmin
                            ? "bg-slate-900 text-white"
                            : isBot
                              ? "border border-sky-200 bg-sky-50 text-sky-950"
                              : "bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="min-h-40 w-[min(720px,calc(100vw-96px))] rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onEditMessage(message.id, editingText);
                                setEditingMessageId("");
                                setEditingText("");
                              }}
                              className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-black text-white"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId("");
                                setEditingText("");
                              }}
                              className="rounded-lg bg-white/15 px-3 py-1 text-xs font-black text-white"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        message.message && <p>{message.message}</p>
                      )}
                      {attachmentUrl && (
                        <div className="mt-3 space-y-2">
                          {message.attachmentMimeType?.startsWith("image/") && (
                            <img src={attachmentUrl} alt={message.attachmentName || "attachment"} className="max-h-72 rounded-xl object-contain" />
                          )}
                          <a
                            href={attachmentUrl}
                            download={message.attachmentName || "support-file"}
                            className={`inline-flex rounded-xl px-3 py-2 text-xs font-black ${
                              isStaff ? "bg-white/15 text-white" : isBot ? "bg-sky-100 text-sky-800" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            Скачать файл
                          </a>
                        </div>
                      )}
                      <p className={`mt-2 text-[11px] ${isStaff ? "text-white/65" : isBot ? "text-sky-600" : "text-slate-400"}`}>
                        {authorLabel} · {new Date(message.createdAt).toLocaleString()}
                      </p>
                      {isStaff && editingMessageId !== message.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditingText(message.message || "");
                          }}
                          className={`mt-2 text-[11px] font-black ${isStaff ? "text-white/75 hover:text-white" : "text-emerald-700"}`}
                        >
                          Редактировать
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {dialog.length === 0 && <Empty text="История чата пуста" />}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[auto_1fr_auto]">
              <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50">
                Прикрепить файл
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => onAttach(event.target.files?.[0] || null)}
                />
              </label>
              <div className="min-w-0">
                <textarea
                  className={areaClass}
                  placeholder="Ответ клиенту..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                />
                {attachment && (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="mt-2 max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                    title="Убрать файл"
                  >
                    {attachment.name} ×
                  </button>
                )}
              </div>
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

function TradeTable({
  trades,
  onClose,
  onUpdate,
}: {
  trades: Trade[];
  onClose: (trade: Trade) => void;
  onUpdate: (tradeId: string, payload: TradeUpdatePayload) => void;
}) {
  return (
    <Panel title="Сделки клиентов">
      <div className="overflow-x-auto">
        <table className="min-w-[1420px] w-full text-sm">
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
            {trades.map((trade) => {
              const isOpen = trade.closePrice === null;
              return (
                <tr key={trade.id} className="border-b border-emerald-50 align-top">
                  <td className="p-3">{trade.user.email}</td>
                  <td className="p-3 font-bold">{trade.symbol}</td>
                  <td className={`p-3 font-bold ${trade.side === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{trade.side}</td>
                  <td className="p-3">
                    {isOpen ? (
                      <TradeEditInput label="Объём" value={trade.volume} step="0.01" onCommit={(value) => onUpdate(trade.id, { volume: value ?? trade.volume })} />
                    ) : (
                      trade.volume
                    )}
                  </td>
                  <td className="p-3">
                    {isOpen ? (
                      <TradeEditInput label="Цена открытия" value={trade.openPrice} onCommit={(value) => onUpdate(trade.id, { openPrice: value ?? trade.openPrice })} />
                    ) : (
                      formatPrice(trade.symbol, trade.openPrice)
                    )}
                  </td>
                  <td className="p-3">
                    {isOpen ? (
                      <TradeEditInput label="TP" value={trade.takeProfit} allowEmpty onCommit={(value) => onUpdate(trade.id, { takeProfit: value })} />
                    ) : trade.takeProfit === null || trade.takeProfit === undefined ? (
                      "-"
                    ) : (
                      formatPrice(trade.symbol, trade.takeProfit)
                    )}
                  </td>
                  <td className="p-3">
                    {isOpen ? (
                      <TradeEditInput label="SL" value={trade.stopLoss} allowEmpty onCommit={(value) => onUpdate(trade.id, { stopLoss: value })} />
                    ) : trade.stopLoss === null || trade.stopLoss === undefined ? (
                      "-"
                    ) : (
                      formatPrice(trade.symbol, trade.stopLoss)
                    )}
                  </td>
                  <td className="p-3">
                    {isOpen ? (
                      <TradeEditInput label="Своп" value={trade.swap ?? 0} step="0.01" allowNegative onCommit={(value) => onUpdate(trade.id, { swap: value ?? 0 })} />
                    ) : (
                      trade.swap ?? 0
                    )}
                  </td>
                  <td className="p-3">{trade.profit === null ? "-" : `€${Number(trade.profit).toFixed(2)}`}</td>
                  <td className="max-w-[220px] truncate p-3 text-slate-500">{trade.comment || "-"}</td>
                  <td className="p-3">
                    {isOpen ? (
                      <button onClick={() => onClose(trade)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Закрыть</button>
                    ) : (
                      <span className="text-xs text-slate-400">Закрыта</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function TradeEditInput({
  label,
  value,
  step = "0.00001",
  allowEmpty = false,
  allowNegative = false,
  onCommit,
}: {
  label: string;
  value?: number | null;
  step?: string;
  allowEmpty?: boolean;
  allowNegative?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const initialValue = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  function commit() {
    const trimmed = draft.trim();
    if (allowEmpty && trimmed === "") {
      if (initialValue !== "") onCommit(null);
      return;
    }

    const numericValue = Number(trimmed);
    if (Number.isNaN(numericValue)) {
      setDraft(initialValue);
      return;
    }

    if (!allowNegative && numericValue < 0) {
      setDraft(initialValue);
      return;
    }

    if (String(numericValue) !== initialValue) {
      onCommit(numericValue);
    }
  }

  return (
    <input
      aria-label={label}
      className="h-9 w-28 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
      inputMode="decimal"
      step={step}
      type="number"
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(initialValue);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function WithdrawalsTable({
  withdrawals,
  onApprove,
  onReject,
  onEditRequisites,
}: {
  withdrawals: Withdrawal[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEditRequisites: (withdrawal: Withdrawal) => void;
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
  {item.adminComment && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-800">Комментарий: {item.adminComment}</p>}
</td>

                <td className="p-3">
                  <Badge value={item.status} />
                </td>

                <td className="p-3 text-slate-500">
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>

                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onEditRequisites(item)}
                      className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      Реквизиты
                    </button>

                    {item.status === "PENDING" ? (
                      <>
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
                      </>
                    ) : (
                      <span className="self-center text-xs text-slate-400">Processed</span>
                    )}
                  </div>
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
  return <Panel title="Верификация клиентов"><div className="overflow-x-auto"><table className="min-w-[860px] w-full text-sm"><thead><tr className="border-b border-emerald-100 text-left text-slate-500"><th className="p-3">Клиент</th><th className="p-3">Документ</th><th className="p-3">Файл</th><th className="p-3">Статус</th><th className="p-3">Действие</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id} className="border-b border-emerald-50"><td className="p-3">{doc.user?.email}</td><td className="p-3">{doc.documentType || "DOCUMENT"}</td><td className="p-3"><div className="flex flex-col gap-2"><span className="break-all">{doc.fileName}</span><a href={`/api/admin/verification/${doc.id}/view`} target="_blank" rel="noopener noreferrer" className="w-fit rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">Открыть</a></div></td><td className="p-3"><Badge value={doc.status} /></td><td className="p-3">{doc.status === "PENDING" ? <div className="flex gap-2"><button onClick={() => onReview(doc.id, "APPROVED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve</button><button onClick={() => onReview(doc.id, "REJECTED")} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Reject</button></div> : <span className="text-xs text-slate-400">Reviewed</span>}</td></tr>)}</tbody></table></div></Panel>;
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}



