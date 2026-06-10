"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("test6@test.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setMessage(t("signingIn"));

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setMessage(data.error || "Ошибка входа");
      return;
    }

    localStorage.setItem("userId", data.id);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);
    localStorage.setItem("isBlocked", String(data.isBlocked));

    setLoading(false);
    setMessage("Вход выполнен. Перенаправление...");
    router.push("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06130d] px-4 py-8 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-lime-400/15 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-emerald-400/15 bg-white p-6 text-slate-900 shadow-2xl shadow-emerald-950/30 dark:bg-slate-900 dark:text-white sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <AsteroLogo />
          <LanguageSwitcher />
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Добро пожаловать в Astero
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Войдите в личный кабинет.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("email")}
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("password")}
            </label>

            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 pr-24 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
                placeholder="Введите пароль"
                type={showPassword ? "text" : "password"}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-white/10"
              >
                {showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>

          {message && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-emerald-50/80">
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-slate-500 dark:border-emerald-400/10 dark:bg-slate-950/60 dark:text-emerald-50/55">
          {t("demoAccount")}: <b>test6@test.com</b> / <b>123456</b>
        </div>
      </div>
    </main>
  );
}