"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "ru";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  en: {
    dashboard: "Dashboard",
    trading: "Trading",
    positions: "Positions",
    history: "History",
    deposits: "Deposits",
    withdrawals: "Withdrawals",
    support: "Support",
    profile: "Profile",
    clientCabinet: "Client cabinet",
    liveDesk: "Astero live desk",
    liveDeskText: "Trading, finance and portfolio analytics in one secure cabinet.",
    traderRoom: "Astero Trader Room",
    realTimeDashboard: "Real-time portfolio and finance dashboard",
    secureLogin: "Secure login",
    welcomeBack: "Welcome back",
    signInText: "Sign in to your Astero trading account.",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    demoAccount: "Demo account",
    language: "Language",
    logout: "Logout",
    crm: "CRM",
    live: "LIVE",
    verification: "Verification",
    personalInfo: "Personal information",
    security: "Security",
  },
  ru: {
    dashboard: "Панель",
    trading: "Терминал",
    positions: "Позиции",
    history: "История",
    deposits: "Пополнения",
    withdrawals: "Вывод средств",
    support: "Поддержка",
    profile: "Профиль",
    clientCabinet: "Кабинет клиента",
    liveDesk: "Рабочее место Astero",
    liveDeskText: "Торговля, финансы и аналитика портфеля в защищённом кабинете.",
    traderRoom: "Кабинет Astero",
    realTimeDashboard: "Портфель, финансы и торговые данные в реальном времени",
    secureLogin: "Безопасный вход",
    welcomeBack: "Добро пожаловать",
    signInText: "Войдите в торговый кабинет Astero.",
    email: "Почта",
    password: "Пароль",
    signIn: "Войти",
    signingIn: "Вход...",
    demoAccount: "Демо аккаунт",
    language: "Язык",
    logout: "Выйти",
    crm: "CRM",
    live: "LIVE",
    verification: "Верификация",
    personalInfo: "Личные данные",
    security: "Безопасность",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    const stored = localStorage.getItem("language");
    if (stored === "ru" || stored === "en") setLanguageState(stored);
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    localStorage.setItem("language", next);
    document.documentElement.lang = next;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => dictionaries[language][key] || key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
