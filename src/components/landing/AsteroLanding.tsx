"use client";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

type LocaleContent = {
  nav: string[];
  login: string;
  signup: string;
  heroBadge: string;
  heroTitle: string;
  heroText: string;
  cabinetLogin: string;
  stats: [string, string][];
  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string[];
  advantagesEyebrow: string;
  advantagesTitle: string;
  openAccount: string;
  advantages: { title: string; text: string }[];
  platformTitle: string;
  platformText: string;
  accountsEyebrow: string;
  accountsTitle: string;
  chooseAccount: string;
  accounts: { name: string; deposit: string; spread: string; features: string[] }[];
  startEyebrow: string;
  startTitle: string;
  steps: string[];
  finalTitle: string;
  riskText: string;
  terminalLive: string;
};

const content: Record<"ru" | "en", LocaleContent> = {
  ru: {
    nav: ["Преимущества", "Платформа", "Счета"],
    login: "Войти",
    signup: "Регистрация",
    heroBadge: "Международная FinTech-платформа",
    heroTitle: "Astero Trader Room",
    heroText:
      "Личный кабинет, торговый терминал, котировки, заявки и поддержка в единой цифровой среде для клиентов и команды сопровождения.",
    cabinetLogin: "Войти в личный кабинет",
    stats: [
      ["100000+", "активных пользователей"],
      ["24/7", "доступ к кабинету"],
      ["6", "категорий рынков"],
    ],
    aboutEyebrow: "Идея Astero",
    aboutTitle: "Платформа для клиентов, которым нужен понятный контроль счета и рынка.",
    aboutText: [
      "Astero объединяет клиентский кабинет, торговую среду, заявки, документы, поддержку и CRM-процессы в одном продукте. Клиент видит ключевые данные без лишнего шума, а команда управляет сопровождением из единой панели.",
      "Продукт развивается как современная FinTech-система: аккуратный интерфейс, быстрая навигация, прозрачная история операций, гибкие настройки торговых инструментов и мобильная адаптация.",
    ],
    advantagesEyebrow: "Преимущества",
    advantagesTitle: "Все для ежедневной работы с рынком и клиентским счетом",
    openAccount: "Открыть кабинет",
    advantages: [
      {
        title: "Единый кабинет",
        text: "Пополнения, выводы, профиль, документы, новости, котировки и поддержка собраны в одном рабочем пространстве.",
      },
      {
        title: "Торговый терминал",
        text: "Котировки, график, сделки, отчет и параметры риска доступны без лишних переходов.",
      },
      {
        title: "CRM-контроль",
        text: "Менеджеры работают с клиентами, заявками, действиями, поддержкой и настройками инструментов из единой панели.",
      },
      {
        title: "Поддержка клиентов",
        text: "Диалог с менеджером, уведомления и вложения помогают быстро обрабатывать обращения.",
      },
    ],
    platformTitle: "Кабинет, терминал и CRM работают как одна экосистема.",
    platformText:
      "Клиент управляет операциями и видит состояние счета. Администратор контролирует клиентскую базу, торговые настройки, заявки, безопасность, обращения и историю действий.",
    accountsEyebrow: "Форматы обслуживания",
    accountsTitle: "Типы счетов для разных уровней работы",
    chooseAccount: "Выбрать",
    accounts: [
      {
        name: "Start",
        deposit: "от €250",
        spread: "Базовые условия",
        features: ["Личный кабинет", "Торговый терминал", "Поддержка в чате"],
      },
      {
        name: "Standard",
        deposit: "от €2 500",
        spread: "Расширенный сервис",
        features: ["Быстрая обработка заявок", "Рыночные новости", "Персональные уведомления"],
      },
      {
        name: "Pro",
        deposit: "от €10 000",
        spread: "Приоритетное сопровождение",
        features: ["Индивидуальные настройки", "Приоритетная поддержка", "Работа с несколькими активами"],
      },
      {
        name: "Prime",
        deposit: "от €50 000",
        spread: "Премиальный формат",
        features: ["Персональный менеджер", "Расширенный контроль счета", "Отдельные условия обслуживания"],
      },
    ],
    startEyebrow: "Как начать",
    startTitle: "Путь клиента остается простым и понятным",
    steps: [
      "Получить доступ к личному кабинету",
      "Заполнить профиль и пройти необходимые проверки",
      "Пополнить счет и открыть торговый терминал",
      "Контролировать сделки, заявки, историю и поддержку",
    ],
    finalTitle: "Готовы войти в Astero Trader Room?",
    riskText:
      "Операции на финансовых рынках связаны с риском. Оценивайте опыт, знания и финансовые возможности перед открытием сделок.",
    terminalLive: "Live",
  },
  en: {
    nav: ["Advantages", "Platform", "Accounts"],
    login: "Sign in",
    signup: "Registration",
    heroBadge: "International FinTech platform",
    heroTitle: "Astero Trader Room",
    heroText:
      "A client cabinet, trading terminal, quotes, requests and support tools in one digital workspace for clients and operations teams.",
    cabinetLogin: "Enter client cabinet",
    stats: [
      ["100000+", "active users"],
      ["24/7", "cabinet access"],
      ["6", "market categories"],
    ],
    aboutEyebrow: "Astero concept",
    aboutTitle: "A platform for clients who need clear control over account and market data.",
    aboutText: [
      "Astero connects the client cabinet, trading workspace, requests, documents, support and CRM workflows in one product. Clients see key information without noise, while the team manages service operations from a single panel.",
      "The product is evolving as a modern FinTech system: clean interface, fast navigation, transparent operation history, flexible instrument settings and mobile adaptation.",
    ],
    advantagesEyebrow: "Advantages",
    advantagesTitle: "Everything for daily market and account work",
    openAccount: "Open cabinet",
    advantages: [
      {
        title: "Unified cabinet",
        text: "Deposits, withdrawals, profile, documents, news, quotes and support are gathered in one workspace.",
      },
      {
        title: "Trading terminal",
        text: "Quotes, charts, trades, reports and risk parameters are available without unnecessary navigation.",
      },
      {
        title: "CRM control",
        text: "Managers work with clients, requests, actions, support and instrument settings from one panel.",
      },
      {
        title: "Client support",
        text: "Manager chat, notifications and attachments help process support requests faster.",
      },
    ],
    platformTitle: "Cabinet, terminal and CRM work as one ecosystem.",
    platformText:
      "Clients manage operations and see account status. Administrators control the client base, trading settings, requests, security, support cases and action history.",
    accountsEyebrow: "Service formats",
    accountsTitle: "Account types for different levels of work",
    chooseAccount: "Choose",
    accounts: [
      {
        name: "Start",
        deposit: "from €250",
        spread: "Basic conditions",
        features: ["Client cabinet", "Trading terminal", "Chat support"],
      },
      {
        name: "Standard",
        deposit: "from €2,500",
        spread: "Extended service",
        features: ["Fast request processing", "Market news", "Personal notifications"],
      },
      {
        name: "Pro",
        deposit: "from €10,000",
        spread: "Priority service",
        features: ["Individual settings", "Priority support", "Multi-asset workflow"],
      },
      {
        name: "Prime",
        deposit: "from €50,000",
        spread: "Premium format",
        features: ["Personal manager", "Extended account control", "Dedicated service conditions"],
      },
    ],
    startEyebrow: "How to start",
    startTitle: "The client journey stays simple and clear",
    steps: [
      "Receive access to the client cabinet",
      "Complete the profile and required checks",
      "Fund the account and open the trading terminal",
      "Control trades, requests, history and support",
    ],
    finalTitle: "Ready to enter Astero Trader Room?",
    riskText:
      "Financial market operations involve risk. Assess your experience, knowledge and financial capacity before opening trades.",
    terminalLive: "Live",
  },
};

const markets = ["Forex", "Metals", "Crypto", "Indices", "Stocks", "Commodities"];

export default function AsteroLanding() {
  const { language } = useLanguage();
  const copy = content[language];

  return (
    <main className="min-h-screen overflow-hidden bg-[#05120c] text-white">
      <Hero copy={copy} />
      <About copy={copy} />
      <Advantages copy={copy} />
      <Platform copy={copy} />
      <Accounts copy={copy} />
      <StartSteps copy={copy} />
      <FinalCta copy={copy} />
    </main>
  );
}

function Hero({ copy }: { copy: LocaleContent }) {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden px-5 py-6 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(52,211,153,0.24),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(163,230,53,0.16),transparent_26%),linear-gradient(135deg,#06130d_0%,#0a1d14_52%,#020705_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute bottom-10 left-1/2 hidden h-[520px] w-[900px] -translate-x-1/2 opacity-60 lg:block">
        <HeroChart />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[86vh] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Astero">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-slate-950 shadow-lg shadow-emerald-950/30">
              A
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">Astero</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.34em] text-emerald-300">
                Trader Room
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-emerald-50/75 md:flex">
            <a href="#advantages" className="transition hover:text-white">{copy.nav[0]}</a>
            <a href="#platform" className="transition hover:text-white">{copy.nav[1]}</a>
            <a href="#accounts" className="transition hover:text-white">{copy.nav[2]}</a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-black text-white transition hover:bg-white/10 sm:inline-flex"
            >
              {copy.login}
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center">
          <div className="max-w-4xl py-20">
            <p className="mb-5 inline-flex rounded-full border border-emerald-300/20 bg-white/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.26em] text-emerald-200">
              {copy.heroBadge}
            </p>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/76">
              {copy.heroText}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-400 px-7 text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/40 transition hover:bg-emerald-300"
              >
                {copy.signup}
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 text-sm font-black text-white transition hover:bg-white/10"
              >
                {copy.cabinetLogin}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 pb-4 sm:grid-cols-3">
          {copy.stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="text-2xl font-black text-emerald-300">{value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-50/55">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About({ copy }: { copy: LocaleContent }) {
  return (
    <section id="about" className="border-y border-emerald-300/10 bg-white py-16 text-slate-950 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-700">{copy.aboutEyebrow}</p>
          <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">{copy.aboutTitle}</h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-slate-600">
          {copy.aboutText.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Advantages({ copy }: { copy: LocaleContent }) {
  return (
    <section id="advantages" className="bg-slate-50 py-16 text-slate-950 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-700">{copy.advantagesEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{copy.advantagesTitle}</h2>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
          >
            {copy.openAccount}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {copy.advantages.map((item) => (
            <article key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 size-10 rounded-2xl bg-emerald-100 ring-8 ring-emerald-50" />
              <h3 className="text-lg font-black">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Platform({ copy }: { copy: LocaleContent }) {
  return (
    <section id="platform" className="bg-[#07130d] py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:px-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">Astero Trader Room</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{copy.platformTitle}</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/70">{copy.platformText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {markets.map((market) => (
              <span key={market} className="rounded-full border border-emerald-300/15 bg-white/5 px-4 py-2 text-xs font-bold text-emerald-50/80">
                {market}
              </span>
            ))}
          </div>
        </div>

        <TerminalPreview liveLabel={copy.terminalLive} />
      </div>
    </section>
  );
}

function Accounts({ copy }: { copy: LocaleContent }) {
  return (
    <section id="accounts" className="bg-white py-16 text-slate-950 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-700">{copy.accountsEyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{copy.accountsTitle}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {copy.accounts.map((account) => (
            <article key={account.name} className="flex min-h-[320px] flex-col rounded-[1.4rem] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-2xl font-black">{account.name}</h3>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{account.deposit}</p>
              <p className="mt-2 text-sm text-slate-500">{account.spread}</p>
              <ul className="mt-7 space-y-3 text-sm text-slate-700">
                {account.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1.5 size-2 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-auto inline-flex h-11 items-center justify-center rounded-full border border-emerald-600 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
              >
                {copy.chooseAccount}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartSteps({ copy }: { copy: LocaleContent }) {
  return (
    <section className="bg-slate-950 py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">{copy.startEyebrow}</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{copy.startTitle}</h2>
        </div>
        <div className="grid gap-3">
          {copy.steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-slate-950">
                {index + 1}
              </span>
              <p className="text-sm font-bold text-emerald-50/85">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ copy }: { copy: LocaleContent }) {
  return (
    <section className="bg-[#06130d] px-5 py-14 text-center sm:px-8 lg:px-10">
      <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{copy.finalTitle}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-emerald-50/65">{copy.riskText}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-400 px-7 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
        >
          {copy.signup}
        </Link>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-sm font-black text-white transition hover:bg-white/10"
        >
          {copy.cabinetLogin}
        </Link>
      </div>
    </section>
  );
}

function HeroChart() {
  const candles = [42, 70, 58, 84, 64, 95, 78, 112, 88, 128, 104, 144, 118, 138, 124, 156, 132, 172, 146, 164, 152, 186];

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 h-px bg-emerald-300/30" />
      <div className="absolute inset-0 flex items-end justify-center gap-5">
        {candles.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="relative w-2 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.42)]"
            style={{ height }}
          >
            <span className="absolute left-1/2 top-[-32px] h-8 w-px -translate-x-1/2 bg-emerald-300/65" />
            <span className="absolute bottom-[-28px] left-1/2 h-7 w-px -translate-x-1/2 bg-emerald-300/45" />
          </span>
        ))}
      </div>
    </div>
  );
}

function TerminalPreview({ liveLabel }: { liveLabel: string }) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-300/12 bg-slate-950/80 p-4 shadow-2xl shadow-black/35">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-300" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-bold text-emerald-50/45">EUR/USD - {liveLabel}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
        <div className="space-y-2">
          {["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "BTC/USD"].map((symbol, index) => (
            <div key={symbol} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-xs">
              <span className="font-bold text-white">{symbol}</span>
              <span className={index % 2 ? "text-red-300" : "text-emerald-300"}>{index % 2 ? "-0.18%" : "+0.24%"}</span>
            </div>
          ))}
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-[#101820] p-4">
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="relative flex h-full items-end justify-center gap-3">
            {[80, 112, 92, 138, 120, 170, 134, 188, 148, 210, 176, 198, 164, 228].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={index % 3 === 1 ? "w-3 rounded-full bg-red-400" : "w-3 rounded-full bg-emerald-400"}
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
