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
  const [attachment, setAttachment] = useState<AttachmentPayload | null>(null);
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatOpenRef = useRef(false);
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
      showToast(`${data.error || (isRu ? "Не удалось загрузить сообщения" : "Could not load messages")}${data.details ? `: ${data.details}` : ""}`);
      return;
    }

    const payload: SupportResponse = Array.isArray(data)
      ? { status: "OPEN", messages: data }
      : data;
    const nextMessages = payload.messages || [];
    const newSupportMessages = nextMessages.filter(
      (item) => (item.sender === "ADMIN" || item.sender === "MANAGER" || item.sender === "BOT") && !seenAdminMessageIdsRef.current.has(item.id)
    );

    setConversationStatus(payload.status || "OPEN");
    setMessages(nextMessages);

    if (messagesReadyRef.current && newSupportMessages.length > 0) {
      showToast(isRu ? "Новое сообщение в поддержке" : "New support message");
      if (!chatOpenRef.current) {
        setHasUnread(true);
        setUnreadCount((count) => count + newSupportMessages.length);
      }
    }

    seenAdminMessageIdsRef.current = new Set(nextMessages.filter((item) => item.sender === "ADMIN" || item.sender === "MANAGER" || item.sender === "BOT").map((item) => item.id));
    messagesReadyRef.current = true;
  }

  async function sendMessage() {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!message.trim() && !attachment) {
      showToast(isRu ? "Введите сообщение или прикрепите файл" : "Enter a message or attach a file");
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
      showToast(`${data.error || (isRu ? "Сообщение не отправлено" : "Message was not sent")}${data.details ? `: ${data.details}` : ""}`);
      return;
    }

    setMessage("");
    setAttachment(null);
    await loadMessages(userId);
  }

  async function attachImage(file: File | null) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(isRu ? "Файл должен быть до 5MB" : "File must be up to 5MB");
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
      showToast(isRu ? "Выйдите из админ-аккаунта и зайдите клиентом." : "Log out of the admin account and sign in as a client.");
      return;
    }

    loadMessages(storedUserId);

    const interval = setInterval(() => loadMessages(storedUserId), 15000);
    return () => {
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (chatOpen) {
      setHasUnread(false);
      setUnreadCount(0);
    }
  }, [messages.length]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    if (chatOpen) {
      setHasUnread(false);
      setUnreadCount(0);
    }
  }, [chatOpen]);

  return (
    <div className="contents">
      {toast && (
        <div className="fixed right-4 top-24 z-[9998] rounded-3xl border border-sky-300/40 bg-slate-950 p-4 text-sm font-black text-white shadow-2xl">
          {toast}
        </div>
      )}

      <button
        onClick={() => {
          setChatOpen(true);
          setHasUnread(false);
          setUnreadCount(0);
        }}
        className={`fixed bottom-5 right-5 z-[9998] rounded-full border border-white/30 px-3 py-2 text-[11px] font-black text-slate-950 shadow-xl backdrop-blur-2xl transition hover:border-white/50 hover:bg-emerald-500/35 dark:text-white ${
          hasUnread
            ? "bg-emerald-500/35 shadow-red-500/25 ring-4 ring-red-500/20"
            : "bg-white/12 shadow-emerald-950/10"
        }`}
      >
        {hasUnread && (
          <span className="absolute -right-1 -top-2 flex size-6 animate-pulse items-center justify-center rounded-full border-2 border-white bg-red-500 text-[11px] font-black text-white shadow-lg">
            {Math.min(unreadCount, 9)}
          </span>
        )}
        {isRu ? "Поддержка" : "Support"}
      </button>

      {chatOpen && (
      <div className="fixed bottom-24 right-6 z-[9999] w-[min(400px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between bg-gradient-to-br from-[#0b2b1d] via-[#0f8a4b] to-[#45d478] px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-700 shadow-sm">
              A
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-emerald-600 bg-lime-400" />
            </div>
            <div>
              <h1 className="text-sm font-black">{isRu ? "Поддержка Astero" : "Astero Support"}</h1>
              <p className="text-xs font-semibold text-white/75">{isRu ? "Обычно отвечаем быстро" : "Usually replies fast"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white/18 px-3 py-1 text-[11px] font-black sm:inline-flex">{conversationStatus === "OPEN" ? "ONLINE" : "CLOSED"}</span>
            <button onClick={() => setChatOpen(false)} className="flex size-8 items-center justify-center rounded-full bg-white/16 text-lg font-black transition hover:bg-white/25">×</button>
          </div>
        </div>
        {conversationStatus === "CLOSED" && (
          <div className="m-3 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs font-bold text-sky-800">
            {isRu ? "Обращение закрыто. Новое сообщение создаст новое обращение." : "The request is closed. A new message will open a new request."}
          </div>
        )}

        <div className="h-[430px] space-y-3 overflow-y-auto bg-[#f4f7f5] p-4 dark:bg-slate-900">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRu ? "Напишите первое сообщение менеджеру" : "Write the first message to your manager"}
              </p>
            </div>
          )}

          {messages.map((item) => {
            const isClient = item.sender === "CLIENT";
            const isBot = item.sender === "BOT";
            const attachmentUrl = item.attachmentBase64 && item.attachmentMimeType
              ? `data:${item.attachmentMimeType};base64,${item.attachmentBase64}`
              : "";

            return (
              <div
                key={item.id}
                className={`max-w-[86%] px-4 py-3 text-sm shadow-sm md:max-w-[72%] ${
                  isClient
                    ? "ml-auto rounded-[20px] rounded-br-md bg-emerald-600 text-white"
                    : isBot
                      ? "mr-auto rounded-[20px] rounded-bl-md border border-emerald-100 bg-white text-slate-800 dark:border-emerald-400/20 dark:bg-white/[0.08] dark:text-white"
                      : "mr-auto rounded-[20px] rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
                }`}
              >
                <p className="font-semibold">
                  {isClient ? (isRu ? "Вы" : "You") : isBot ? (isRu ? "Astero Bot" : "Astero Bot") : (isRu ? "Менеджер" : "Manager")}
                </p>
                {item.message && <p className="mt-1 leading-6">{item.message}</p>}
                {attachmentUrl && (
                  item.attachmentMimeType?.startsWith("image/") ? (
                    <img src={attachmentUrl} alt={item.attachmentName || "attachment"} className="mt-2 max-h-40 rounded-lg object-contain" />
                  ) : (
                    <a href={attachmentUrl} download={item.attachmentName || "support-file"} className="mt-2 inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      {isRu ? "Скачать файл" : "Download file"}
                    </a>
                  )
                )}
                <p className="mt-2 text-[10px] opacity-60">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
            <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg font-black text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-500/10" title={isRu ? "Прикрепить файл" : "Attach file"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.3 11.7L12.1 19.9C9.8 22.2 6 22.2 3.7 19.9C1.4 17.6 1.4 13.8 3.7 11.5L12.5 2.7C14.1 1.1 16.7 1.1 18.3 2.7C19.9 4.3 19.9 6.9 18.3 8.5L9.6 17.2C8.7 18.1 7.3 18.1 6.4 17.2C5.5 16.3 5.5 14.9 6.4 14L14.1 6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input type="file" onChange={(event) => attachImage(event.target.files?.[0] || null)} className="hidden" />
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              placeholder={isRu ? "Напишите сообщение..." : "Write a message..."}
            />
            <button onClick={sendMessage} className="h-10 shrink-0 rounded-full bg-emerald-600 px-5 text-sm font-black text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-500">
              {isRu ? "Отправить" : "Send"}
            </button>
          </div>
          {attachment && (
            <button type="button" onClick={() => setAttachment(null)} className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              {isRu ? "Прикреплено: " : "Attached: "}{attachment.name} ×
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
