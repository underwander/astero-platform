"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRu = language === "ru";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function translateError(error?: string) {
    if (!isRu) return error || "Sign in error";

    if (error === "Invalid credentials") return "Неверная почта или пароль";
    if (error === "User not found") return "Пользователь не найден";
    if (error === "Wrong password") return "Неверный пароль";
    if (error === "Your account is blocked") return "Аккаунт заблокирован";
    if (error === "Email and password required") return "Введите почту и пароль";
    if (error === "Access temporarily restricted") return "Доступ временно ограничен";
    if (error === "Too many attempts. Try again later") return "Слишком много попыток. Попробуйте позже";

    return error || "Ошибка входа";
  }

  async function login(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setMessage(isRu ? "Проверяем данные..." : "Checking credentials...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setMessage(translateError(data.error));
        return;
      }

      localStorage.setItem("userId", data.id);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      localStorage.setItem("isBlocked", String(data.isBlocked));

      setLoading(false);
      setMessage(isRu ? "Вход выполнен. Открываем кабинет..." : "Signed in. Opening cabinet...");
      router.push(data.role === "ADMIN" || data.role === "MANAGER" ? "/crm" : "/dashboard");
    } catch {
      setLoading(false);
      setMessage(isRu ? "Сервер временно недоступен" : "Server is temporarily unavailable");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06130d] px-4 py-8 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-lime-400/15 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-emerald-400/15 bg-white p-6 text-slate-900 shadow-2xl shadow-emerald-950/30 dark:bg-slate-900 dark:text-white sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <AsteroLogo />
          <LanguageSwitcher />
        </div>

        <div className="mb-7">
          <Link href="/" className="mb-4 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-600">
            {isRu ? "На главную" : "Back to home"}
          </Link>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {isRu ? "Добро пожаловать в Astero" : "Welcome to Astero"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRu ? "Войдите в личный кабинет." : "Sign in to your client cabinet."}
          </p>
        </div>

        <form onSubmit={login} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("email")}
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
              placeholder="email@example.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("password")}
            </label>

            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 pr-24 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
                placeholder={isRu ? "Введите пароль" : "Enter password"}
                type={showPassword ? "text" : "password"}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-white/10"
              >
                {showPassword ? (isRu ? "Скрыть" : "Hide") : isRu ? "Показать" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (isRu ? "Входим..." : "Signing in...") : t("signIn")}
          </button>

          {message && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-emerald-50/80">
              {message}
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isRu ? "Нет аккаунта?" : "No account yet?"}{" "}
          <Link href="/signup" className="font-black text-emerald-700 hover:text-emerald-600 dark:text-emerald-300">
            {isRu ? "Регистрация" : "Create account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
