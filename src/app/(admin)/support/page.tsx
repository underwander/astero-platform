"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type SupportMessage = {
  id: string;
  sender: string | null;
  message: string;
  createdAt: string;
};

export default function SupportPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountRole, setAccountRole] = useState("");

  const isRu = language === "ru";

  async function loadMessages(currentUserId: string) {
    const res = await fetch(`/api/user/support?userId=${currentUserId}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || (isRu ? "Не удалось загрузить сообщения" : "Could not load messages"));
      return;
    }

    setMessages(Array.isArray(data) ? data : []);
  }

  async function sendMessage() {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!message.trim()) {
      setStatus(isRu ? "Введите сообщение" : "Enter a message");
      return;
    }

    const res = await fetch("/api/user/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ userId, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || (isRu ? "Сообщение не отправлено" : "Message was not sent"));
      return;
    }

    setMessage("");
    setStatus(isRu ? "Сообщение отправлено" : "Message sent");
    await loadMessages(userId);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role") || "";
    const storedEmail = localStorage.getItem("email") || "";

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setAccountRole(storedRole);
    setAccountEmail(storedEmail);
    setUserId(storedUserId);

    if (storedRole === "ADMIN" || storedRole === "MANAGER") {
      setStatus(isRu ? "Вы открыли клиентскую поддержку из админ-аккаунта. Выйдите и зайдите клиентом." : "You opened client Support from an admin account. Log out and sign in as a client.");
      return;
    }

    loadMessages(storedUserId);

    const interval = setInterval(() => loadMessages(storedUserId), 15000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-5">
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {isRu ? "Поддержка" : "Support"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/60">
          {isRu ? "Напишите сообщение менеджеру." : "Send a message to your manager."}
        </p>
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
          {accountEmail || "-"} · {accountRole || "CLIENT"}
        </p>
      </div>

      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] md:p-6">
        <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-400/10 dark:bg-slate-950/50">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">
              {isRu ? "Сообщений пока нет" : "No messages yet"}
            </p>
          )}

          {messages.map((item) => {
            const isClient = item.sender === "CLIENT";

            return (
              <div
                key={item.id}
                className={`max-w-[85%] rounded-3xl p-4 text-sm ${
                  isClient
                    ? "ml-auto bg-emerald-600 text-white"
                    : "mr-auto bg-white text-slate-800 shadow-sm dark:bg-white/[0.08] dark:text-white"
                }`}
              >
                <p className="font-semibold">
                  {isClient ? (isRu ? "Вы" : "You") : (isRu ? "Менеджер" : "Manager")}
                </p>
                <p className="mt-1 leading-6">{item.message}</p>
                <p className="mt-2 text-xs opacity-70">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-28 rounded-3xl border border-emerald-100 p-4 text-sm outline-none focus:border-emerald-500 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
            placeholder={isRu ? "Напишите сообщение..." : "Write a message..."}
          />
          <button onClick={sendMessage} className="rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-black text-white hover:bg-emerald-500">
            {isRu ? "Отправить" : "Send"}
          </button>
        </div>

        {status && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{status}</p>}
      </div>
    </div>
  );
}
