"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type SupportMessage = {
  id: string;
  sender: string | null;
  message: string;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentBase64?: string | null;
  createdAt: string;
};

type SupportResponse = {
  status: "OPEN" | "CLOSED";
  messages: SupportMessage[];
};

type AttachmentPayload = {
  name: string;
  mimeType: string;
  base64: string;
};

export default function SupportPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [conversationStatus, setConversationStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [attachment, setAttachment] = useState<AttachmentPayload | null>(null);
  const [toast, setToast] = useState("");
  const seenAdminMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesReadyRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRu = language === "ru";

  function playNotificationSound() {
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.setValueAtTime(740, audio.currentTime);
      oscillator.frequency.setValueAtTime(980, audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.3);
    } catch {}
  }

  function showToast(text: string) {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 7000);
    playNotificationSound();
  }

  async function loadMessages(currentUserId: string) {
    const res = await fetch(`/api/user/support?userId=${currentUserId}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(`${data.error || (isRu ? "Не удалось загрузить сообщения" : "Could not load messages")}${data.details ? `: ${data.details}` : ""}`);
      return;
    }

    const payload: SupportResponse = Array.isArray(data)
      ? { status: "OPEN", messages: data }
      : data;
    const nextMessages = payload.messages || [];
    const newAdminMessages = nextMessages.filter(
      (item) => item.sender === "ADMIN" && !seenAdminMessageIdsRef.current.has(item.id)
    );

    setConversationStatus(payload.status || "OPEN");
    setMessages(nextMessages);

    if (messagesReadyRef.current && newAdminMessages.length > 0) {
      showToast(isRu ? "Новое сообщение от менеджера" : "New message from manager");
    }

    seenAdminMessageIdsRef.current = new Set(nextMessages.filter((item) => item.sender === "ADMIN").map((item) => item.id));
    messagesReadyRef.current = true;
  }

  async function sendMessage() {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!message.trim() && !attachment) {
      setStatus(isRu ? "Введите сообщение или прикрепите изображение" : "Enter a message or attach an image");
      return;
    }

    const res = await fetch("/api/user/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ userId, message, attachment }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`${data.error || (isRu ? "Сообщение не отправлено" : "Message was not sent")}${data.details ? `: ${data.details}` : ""}`);
      return;
    }

    setMessage("");
    setAttachment(null);
    setStatus(isRu ? "Сообщение отправлено" : "Message sent");
    await loadMessages(userId);
  }

  async function attachImage(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus(isRu ? "Можно прикреплять только изображения" : "Only images can be attached");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus(isRu ? "Изображение должно быть до 5MB" : "Image must be up to 5MB");
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setAttachment({ name: file.name, mimeType: file.type, base64 });
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedRole = localStorage.getItem("role") || "";

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);

    if (storedRole === "ADMIN" || storedRole === "MANAGER") {
      setStatus(isRu ? "Выйдите из админ-аккаунта и зайдите клиентом." : "Log out of the admin account and sign in as a client.");
      return;
    }

    loadMessages(storedUserId);

    const interval = setInterval(() => loadMessages(storedUserId), 15000);
    return () => {
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast && (
        <div className="fixed right-4 top-24 z-[80] rounded-3xl border border-sky-300/40 bg-slate-950 p-4 text-sm font-black text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-5">
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {isRu ? "Поддержка" : "Support"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/60">
          {isRu ? "Напишите сообщение менеджеру." : "Send a message to your manager."}
        </p>
      </div>

      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] md:p-6">
        {conversationStatus === "CLOSED" && (
          <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-bold text-sky-800">
            {isRu ? "Обращение закрыто. Новое сообщение создаст новое обращение." : "The request is closed. A new message will open a new request."}
          </div>
        )}

        <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-400/10 dark:bg-slate-950/50">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">
              {isRu ? "Сообщений пока нет" : "No messages yet"}
            </p>
          )}

          {messages.map((item) => {
            const isClient = item.sender === "CLIENT";
            const attachmentUrl = item.attachmentBase64 && item.attachmentMimeType
              ? `data:${item.attachmentMimeType};base64,${item.attachmentBase64}`
              : "";

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
                {item.message && <p className="mt-1 leading-6">{item.message}</p>}
                {attachmentUrl && (
                  <img src={attachmentUrl} alt={item.attachmentName || "attachment"} className="mt-3 max-h-64 rounded-2xl object-contain" />
                )}
                <p className="mt-2 text-xs opacity-70">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 w-full rounded-3xl border border-emerald-100 p-4 text-sm outline-none focus:border-emerald-500 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
              placeholder={isRu ? "Напишите сообщение..." : "Write a message..."}
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-400/10 dark:bg-white/[0.04] dark:text-emerald-200 dark:hover:bg-white/[0.08]">
                <span className="text-lg leading-none">+</span>
                {isRu ? "Прикрепить картинку" : "Attach image"}
                <input type="file" accept="image/*" onChange={(event) => attachImage(event.target.files?.[0] || null)} className="hidden" />
              </label>
              {attachment && (
                <button type="button" onClick={() => setAttachment(null)} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {attachment.name} x
                </button>
              )}
            </div>
          </div>
          <button onClick={sendMessage} className="rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-black text-white hover:bg-emerald-500">
            {isRu ? "Отправить" : "Send"}
          </button>
        </div>

        {status && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{status}</p>}
      </div>
    </div>
  );
}
