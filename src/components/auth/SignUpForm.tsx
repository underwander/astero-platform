"use client";

import AsteroLogo from "@/components/brand/AsteroLogo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Link from "next/link";
import React, { useState } from "react";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    password: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Самостоятельная регистрация недоступна. Счет создает менеджер Astero.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06130d] px-4 py-8 text-white">
      <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-140px] h-96 w-96 rounded-full bg-lime-400/12 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-white shadow-2xl shadow-black/35 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden bg-[#07130d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <AsteroLogo />
            <h1 className="mt-14 text-5xl font-black leading-[0.98] tracking-tight">
              Откройте кабинет Astero
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-emerald-50/70">
              Зарегистрируйтесь, заполните профиль и получите доступ к панели клиента, торговому терминалу, заявкам и поддержке.
            </p>
          </div>

          <div className="grid gap-3">
            {["Личный кабинет", "Торговый терминал", "Пополнения и выводы", "Поддержка клиентов"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <span className="size-2 rounded-full bg-emerald-300" />
                <span className="text-sm font-bold text-emerald-50/85">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 text-slate-950 sm:p-8 lg:p-10">
          <div className="mb-7 flex items-center justify-between gap-3 lg:justify-end">
            <div className="lg:hidden">
              <AsteroLogo />
            </div>
            <LanguageSwitcher />
          </div>

          <div className="mb-7">
            <Link href="/" className="text-sm font-bold text-emerald-700 hover:text-emerald-600">
              На главную
            </Link>
            <h2 className="mt-4 text-3xl font-black tracking-tight">Регистрация</h2>
            <p className="mt-2 text-sm text-slate-500">
              Заполните данные, чтобы создать личный кабинет.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Имя" value={form.firstName} onChange={(value) => updateField("firstName", value)} placeholder="Иван" />
              <Field label="Фамилия" value={form.lastName} onChange={(value) => updateField("lastName", value)} placeholder="Иванов" />
            </div>

            <Field
              label="Email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              placeholder="email@example.com"
              type="email"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Телефон" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="+1 000 000 0000" />
              <Field label="Страна" value={form.country} onChange={(value) => updateField("country", value)} placeholder="United States" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Город" value={form.city} onChange={(value) => updateField("city", value)} placeholder="New York" />
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Пароль</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 pr-24 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Минимум 6 символов"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                  >
                    {showPassword ? "Скрыть" : "Показать"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Отправить заявку
            </button>

            {message && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-slate-700">
                {message}
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-black text-emerald-700 hover:text-emerald-600">
              Войти в кабинет
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </div>
  );
}
