"use client";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type LandingEntry = {
  key: string;
  titleRu: string;
  titleEn: string;
  bodyRu: string;
  bodyEn: string;
  kind: string;
  dataJson: string;
  isVisible: boolean;
  sortOrder: number;
};

type QuoteCard = {
  symbol: string;
  price: number;
  changePercent?: number;
  market?: string;
};

const fallbackEntries: LandingEntry[] = [
  {
    key: "hero",
    kind: "hero",
    sortOrder: 10,
    isVisible: true,
    titleRu: "Astero Trader Room",
    titleEn: "Astero Trader Room",
    bodyRu:
      "Премиальная FinTech-платформа для управления инвестиционным счетом, рыночной аналитикой, заявками, документами и поддержкой в едином защищенном пространстве.",
    bodyEn:
      "A premium FinTech workspace for managing an investment account, market analytics, requests, documents and support in one secure environment.",
    dataJson: JSON.stringify({
      eyebrowRu: "Международная инвестиционная платформа",
      eyebrowEn: "International investment platform",
      primaryCtaRu: "Войти в кабинет",
      primaryCtaEn: "Enter cabinet",
      secondaryCtaRu: "Создать заявку",
      secondaryCtaEn: "Create request",
    }),
  },
  {
    key: "stats",
    kind: "stats",
    sortOrder: 20,
    isVisible: true,
    titleRu: "Платформа в цифрах",
    titleEn: "Platform in numbers",
    bodyRu: "Ключевые показатели сервиса и возможности платформы.",
    bodyEn: "Key service indicators and platform capabilities.",
    dataJson: JSON.stringify({
      items: [
        { value: "100000+", ru: "активных пользователей", en: "active users" },
        { value: "24/7", ru: "доступ к кабинету", en: "cabinet access" },
        { value: "6", ru: "категорий рынков", en: "market categories" },
        { value: "0.01", ru: "минимальный объем", en: "minimum volume" },
      ],
    }),
  },
  {
    key: "advantages",
    kind: "cards",
    sortOrder: 30,
    isVisible: true,
    titleRu: "Почему выбирают Astero",
    titleEn: "Why clients choose Astero",
    bodyRu: "Сервис соединяет клиентский кабинет, торговый терминал и CRM-команду в одной стабильной системе.",
    bodyEn: "The service connects client cabinet, trading terminal and CRM operations in one stable system.",
    dataJson: JSON.stringify({
      items: [
        {
          ruTitle: "Безопасный кабинет",
          enTitle: "Secure cabinet",
          ruText: "Профиль, документы, заявки, история операций и поддержка находятся в одном защищенном интерфейсе.",
          enText: "Profile, documents, requests, operation history and support live in one protected interface.",
        },
        {
          ruTitle: "Торговый терминал",
          enTitle: "Trading terminal",
          ruText: "График, котировки, сделки, отчет и параметры риска доступны без лишних переходов.",
          enText: "Chart, quotes, trades, reports and risk parameters are available without unnecessary navigation.",
        },
        {
          ruTitle: "Рыночная аналитика",
          enTitle: "Market analytics",
          ruText: "Котировки, новости трейдера и обзор рынков помогают быстрее оценивать ситуацию.",
          enText: "Quotes, trader news and market overview help assess market conditions faster.",
        },
        {
          ruTitle: "CRM-сопровождение",
          enTitle: "CRM operations",
          ruText: "Менеджеры видят клиентов, заявки, действия, поддержку и торговые настройки в единой панели.",
          enText: "Managers see clients, requests, actions, support and trading settings from one panel.",
        },
      ],
    }),
  },
  {
    key: "markets",
    kind: "cards",
    sortOrder: 40,
    isVisible: true,
    titleRu: "Рынки и инструменты",
    titleEn: "Markets and instruments",
    bodyRu: "Forex, металлы, криптовалюты, индексы и акции собраны в интерфейсе для ежедневной работы.",
    bodyEn: "Forex, metals, crypto, indices and stocks are collected in an interface built for daily work.",
    dataJson: JSON.stringify({
      items: [
        { ruTitle: "Forex", enTitle: "Forex", ruText: "Основные валютные пары и кроссы.", enText: "Major pairs and crosses." },
        { ruTitle: "Металлы", enTitle: "Metals", ruText: "Золото и серебро для диверсификации.", enText: "Gold and silver for diversification." },
        { ruTitle: "Крипто", enTitle: "Crypto", ruText: "Популярные цифровые активы.", enText: "Popular digital assets." },
        { ruTitle: "Индексы", enTitle: "Indices", ruText: "US100, SPX500, DAX40 и другие рынки.", enText: "US100, SPX500, DAX40 and other markets." },
      ],
    }),
  },
  {
    key: "platform",
    kind: "cards",
    sortOrder: 50,
    isVisible: true,
    titleRu: "Возможности платформы",
    titleEn: "Platform features",
    bodyRu: "Astero закрывает ключевые процессы: от регистрации клиента до поддержки, заявок и контроля торговых параметров.",
    bodyEn: "Astero covers key workflows: from client onboarding to support, requests and trading-parameter control.",
    dataJson: JSON.stringify({
      items: [
        { ruTitle: "Личный кабинет", enTitle: "Client cabinet", ruText: "Панель, профиль, пополнения, выводы и документы.", enText: "Dashboard, profile, deposits, withdrawals and documents." },
        { ruTitle: "Поддержка", enTitle: "Support", ruText: "Чат, вложения, уведомления и архив обращений.", enText: "Chat, attachments, notifications and ticket archive." },
        { ruTitle: "Настройка котировок", enTitle: "Quote management", ruText: "Маржа, спреды, свопы, стоимость пункта и ручные цены.", enText: "Margin, spreads, swaps, tick value and manual prices." },
        { ruTitle: "Мобильный доступ", enTitle: "Mobile access", ruText: "Интерфейс адаптирован для iOS, Android, планшетов и ПК.", enText: "The interface is adapted for iOS, Android, tablets and desktop." },
      ],
    }),
  },
  {
    key: "accounts",
    kind: "accounts",
    sortOrder: 60,
    isVisible: true,
    titleRu: "Форматы обслуживания",
    titleEn: "Service formats",
    bodyRu: "Типы счетов показывают варианты обслуживания и могут быть отредактированы администратором в CRM.",
    bodyEn: "Account formats describe service options and can be edited by an administrator in CRM.",
    dataJson: JSON.stringify({
      items: [
        { name: "Start", deposit: "от EUR 250", ruText: "Базовый доступ к кабинету и терминалу.", enText: "Basic access to cabinet and terminal." },
        { name: "Standard", deposit: "от EUR 2 500", ruText: "Расширенная поддержка и рыночные материалы.", enText: "Extended support and market materials." },
        { name: "Pro", deposit: "от EUR 10 000", ruText: "Приоритетное сопровождение и гибкие условия.", enText: "Priority service and flexible conditions." },
        { name: "Prime", deposit: "от EUR 50 000", ruText: "Индивидуальный формат для крупных клиентов.", enText: "Individual format for larger clients." },
      ],
    }),
  },
  {
    key: "calculator",
    kind: "calculator",
    sortOrder: 70,
    isVisible: true,
    titleRu: "Калькулятор потенциального результата",
    titleEn: "Potential result calculator",
    bodyRu: "Расчет является примером и не гарантирует будущую прибыль.",
    bodyEn: "The calculation is an example and does not guarantee future profit.",
    dataJson: JSON.stringify({ minMonthlyRate: 0.15, maxMonthlyRate: 0.3, defaultAmount: 5000 }),
  },
  {
    key: "calendar",
    kind: "calendar",
    sortOrder: 80,
    isVisible: true,
    titleRu: "Экономический календарь",
    titleEn: "Economic calendar",
    bodyRu: "Ключевые события недели для трейдеров и аналитиков.",
    bodyEn: "Key weekly events for traders and analysts.",
    dataJson: JSON.stringify({
      items: [
        { time: "10:00", country: "EU", ruEvent: "Индекс деловой активности", enEvent: "Business activity index", ruImpact: "Средняя", enImpact: "Medium" },
        { time: "15:30", country: "US", ruEvent: "Заявки по безработице", enEvent: "Jobless claims", ruImpact: "Высокая", enImpact: "High" },
        { time: "17:00", country: "US", ruEvent: "Индекс потребительского доверия", enEvent: "Consumer confidence index", ruImpact: "Средняя", enImpact: "Medium" },
      ],
    }),
  },
  {
    key: "education",
    kind: "cards",
    sortOrder: 90,
    isVisible: true,
    titleRu: "Образовательный центр",
    titleEn: "Education center",
    bodyRu: "Материалы помогают клиенту быстрее разобраться в терминале, рисках и базовых принципах работы с рынком.",
    bodyEn: "Materials help clients understand the terminal, risks and the basics of market work faster.",
    dataJson: JSON.stringify({
      items: [
        { ruTitle: "Основы терминала", enTitle: "Terminal basics", ruText: "Как открыть график, выбрать объем и контролировать позиции.", enText: "How to open a chart, choose volume and control positions." },
        { ruTitle: "Управление риском", enTitle: "Risk management", ruText: "Как читать маржу, залог, свободные средства и отчет.", enText: "How to read margin, collateral, free funds and reports." },
        { ruTitle: "Документы и KYC", enTitle: "Documents and KYC", ruText: "Что нужно подготовить для проверки профиля.", enText: "What to prepare for profile verification." },
      ],
    }),
  },
  {
    key: "banner",
    kind: "banner",
    sortOrder: 95,
    isVisible: true,
    titleRu: "Инвестиционная инфраструктура для ежедневного контроля",
    titleEn: "Investment infrastructure for daily control",
    bodyRu:
      "Astero объединяет личный кабинет, торговый терминал, поддержку и операционные процессы в единую среду, где клиент видит счет, историю и рыночные данные без лишнего шума.",
    bodyEn:
      "Astero combines the client cabinet, trading terminal, support and operational workflows into one environment where clients see account status, history and market data without noise.",
    dataJson: JSON.stringify({
      image: "/images/pwa/astero-icon-512.png",
      altRu: "Визуальный знак Astero",
      altEn: "Astero visual mark",
      points: [
        { ru: "Единый интерфейс для операций и аналитики", en: "Unified interface for operations and analytics" },
        { ru: "CRM-управление контентом и клиентским сервисом", en: "CRM control over content and client service" },
        { ru: "Адаптация под desktop, tablet и mobile", en: "Adapted for desktop, tablet and mobile" },
      ],
    }),
  },
  {
    key: "news",
    kind: "news",
    sortOrder: 96,
    isVisible: true,
    titleRu: "Новости трейдера",
    titleEn: "Trader news",
    bodyRu:
      "Короткие рыночные заметки помогают клиентам быстрее понять, какие события могут влиять на валюты, металлы, индексы и цифровые активы.",
    bodyEn:
      "Short market notes help clients understand which events can affect currencies, metals, indices and digital assets.",
    dataJson: JSON.stringify({
      items: [
        {
          date: "Сегодня",
          categoryRu: "Макро",
          categoryEn: "Macro",
          titleRu: "Рынки оценивают ожидания по процентным ставкам",
          titleEn: "Markets assess interest-rate expectations",
          textRu: "Инвесторы следят за комментариями регуляторов и данными по инфляции, которые могут усилить волатильность основных валютных пар.",
          textEn: "Investors are watching central-bank comments and inflation data that may increase volatility in major currency pairs.",
        },
        {
          date: "Сегодня",
          categoryRu: "Индексы",
          categoryEn: "Indices",
          titleRu: "Технологический сектор остается в фокусе",
          titleEn: "Technology sector remains in focus",
          textRu: "Спрос на акции крупных технологических компаний продолжает влиять на динамику US100 и широкие фондовые индексы.",
          textEn: "Demand for large technology stocks continues to influence US100 and broader equity indices.",
        },
        {
          date: "Сегодня",
          categoryRu: "Металлы",
          categoryEn: "Metals",
          titleRu: "Золото реагирует на доходности облигаций",
          titleEn: "Gold reacts to bond yields",
          textRu: "Движение доходностей и спрос на защитные активы формируют краткосрочную динамику XAU/USD.",
          textEn: "Yield dynamics and defensive demand shape short-term movement in XAU/USD.",
        },
      ],
    }),
  },
  {
    key: "articles",
    kind: "articles",
    sortOrder: 97,
    isVisible: true,
    titleRu: "Практические статьи",
    titleEn: "Practical articles",
    bodyRu:
      "Материалы написаны простым языком и помогают использовать платформу осознанно: от чтения отчета до понимания риска сделки.",
    bodyEn:
      "Materials are written in clear language and help clients use the platform consciously: from reading reports to understanding trade risk.",
    dataJson: JSON.stringify({
      items: [
        {
          timeRu: "6 минут",
          timeEn: "6 min",
          titleRu: "Как читать свободные средства и залог",
          titleEn: "How to read free funds and collateral",
          textRu: "Разбираем, какие показатели важны перед открытием сделки и почему их нужно контролировать до изменения цены.",
          textEn: "A practical overview of key indicators before opening a trade and why they should be monitored before price changes.",
        },
        {
          timeRu: "8 минут",
          timeEn: "8 min",
          titleRu: "Что влияет на движение валютных пар",
          titleEn: "What affects currency-pair movement",
          textRu: "Макроэкономические данные, ставка, ожидания рынка и ликвидность формируют направление и скорость движения цены.",
          textEn: "Macroeconomic data, rates, market expectations and liquidity shape price direction and speed.",
        },
        {
          timeRu: "5 минут",
          timeEn: "5 min",
          titleRu: "Как использовать новости без перегрузки",
          titleEn: "How to use news without overload",
          textRu: "Выбираем важные события, отслеживаем влияние на активы и не превращаем ленту новостей в шум.",
          textEn: "Select important events, track their impact on assets and avoid turning the news flow into noise.",
        },
      ],
    }),
  },
  {
    key: "faq",
    kind: "faq",
    sortOrder: 100,
    isVisible: true,
    titleRu: "Ответы на вопросы",
    titleEn: "Questions and answers",
    bodyRu: "Краткие ответы на основные вопросы о кабинете, заявках и торговом терминале.",
    bodyEn: "Short answers to key questions about the cabinet, requests and trading terminal.",
    dataJson: JSON.stringify({
      items: [
        { ruQ: "Как получить доступ к кабинету?", enQ: "How do I get cabinet access?", ruA: "Доступ создает администратор или менеджер в CRM.", enA: "Access is created by an administrator or manager in CRM." },
        { ruQ: "Где посмотреть операции?", enQ: "Where can I see operations?", ruA: "История пополнений и выводов доступна в панели клиента.", enA: "Deposit and withdrawal history is available in the client dashboard." },
        { ruQ: "Можно ли открыть сайт с телефона?", enQ: "Can I use it on mobile?", ruA: "Да, интерфейс адаптирован под мобильные браузеры и установку на главный экран.", enA: "Yes, the interface is adapted for mobile browsers and home-screen installation." },
      ],
    }),
  },
  {
    key: "reviews",
    kind: "reviews",
    sortOrder: 110,
    isVisible: true,
    titleRu: "Отзывы клиентов",
    titleEn: "Client reviews",
    bodyRu: "Демонстрационные отзывы можно заменить реальными материалами через CRM.",
    bodyEn: "Demonstration reviews can be replaced with real materials through CRM.",
    dataJson: JSON.stringify({
      items: [
        { name: "M. Keller", country: "Germany", rating: 5, ruText: "Кабинет понятный: заявки, история и поддержка доступны без лишних шагов.", enText: "The cabinet is clear: requests, history and support are available without extra steps." },
        { name: "S. Ivanova", country: "Bulgaria", rating: 5, ruText: "Удобно контролировать счет и быстро писать менеджеру прямо из платформы.", enText: "It is convenient to control the account and message the manager directly from the platform." },
        { name: "A. Martin", country: "Spain", rating: 5, ruText: "Терминал и профиль хорошо работают с телефона, вся информация на месте.", enText: "The terminal and profile work well from mobile, all information is in place." },
      ],
    }),
  },
  {
    key: "cta",
    kind: "cta",
    sortOrder: 115,
    isVisible: true,
    titleRu: "Готовы перейти в Astero Trader Room?",
    titleEn: "Ready to enter Astero Trader Room?",
    bodyRu:
      "Получите доступ к кабинету, проверьте профиль, следите за рынками и управляйте заявками из единого пространства.",
    bodyEn:
      "Access the cabinet, verify the profile, monitor markets and manage requests from one workspace.",
    dataJson: JSON.stringify({
      primaryHref: "/login",
      secondaryHref: "/signup",
      primaryRu: "Войти в кабинет",
      primaryEn: "Enter cabinet",
      secondaryRu: "Оставить заявку",
      secondaryEn: "Create request",
    }),
  },
  {
    key: "footer",
    kind: "footer",
    sortOrder: 120,
    isVisible: true,
    titleRu: "Astero",
    titleEn: "Astero",
    bodyRu:
      "Astero предоставляет программные решения, инструменты аналитики и рыночные агрегации. Операции на финансовых рынках связаны с риском.",
    bodyEn:
      "Astero provides software solutions, analytics tools and market aggregations. Financial market operations involve risk.",
    dataJson: JSON.stringify({ email: "support@astero.online" }),
  },
  {
    key: "seo",
    kind: "seo",
    sortOrder: 130,
    isVisible: true,
    titleRu: "Astero | Международная инвестиционная платформа",
    titleEn: "Astero | International investment platform",
    bodyRu:
      "Astero Trader Room — современная FinTech-платформа с личным кабинетом, торговым терминалом, котировками, аналитикой и поддержкой.",
    bodyEn:
      "Astero Trader Room is a modern FinTech platform with a client cabinet, trading terminal, quotes, analytics and support.",
    dataJson: JSON.stringify({
      keywordsRu: "Astero, инвестиционная платформа, торговый терминал, личный кабинет, котировки",
      keywordsEn: "Astero, investment platform, trading terminal, client cabinet, quotes",
      ogImage: "/images/pwa/astero-icon-512.png",
    }),
  },
];

const fallbackQuotes: QuoteCard[] = [
  { symbol: "EUR/USD", price: 1.0852, changePercent: 0.18, market: "Forex" },
  { symbol: "BTC/USD", price: 64250, changePercent: 1.24, market: "Crypto" },
  { symbol: "ETH/USD", price: 3480, changePercent: -0.42, market: "Crypto" },
  { symbol: "XAU/USD", price: 2325.4, changePercent: 0.31, market: "Metals" },
  { symbol: "US100", price: 19840, changePercent: 0.64, market: "Indices" },
  { symbol: "SPX500", price: 5530, changePercent: 0.22, market: "Indices" },
];

function parseData<T>(entry: LandingEntry | undefined, fallback: T): T {
  if (!entry?.dataJson) return fallback;
  try {
    return JSON.parse(entry.dataJson) as T;
  } catch {
    return fallback;
  }
}

function text(entry: LandingEntry | undefined, field: "title" | "body", language: "ru" | "en") {
  if (!entry) return "";
  if (field === "title") return language === "ru" ? entry.titleRu : entry.titleEn;
  return language === "ru" ? entry.bodyRu : entry.bodyEn;
}

function priceLabel(quote: QuoteCard) {
  if (quote.price >= 1000) {
    return quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return quote.price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 5 });
}

function updateMeta(name: string, content: string) {
  if (typeof document === "undefined" || !content) return;
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function updateMetaProperty(property: string, content: string) {
  if (typeof document === "undefined" || !content) return;
  let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export default function AsteroLanding() {
  const { language } = useLanguage();
  const [entries, setEntries] = useState<LandingEntry[]>(fallbackEntries);
  const [quotes, setQuotes] = useState<QuoteCard[]>(fallbackQuotes);

  useEffect(() => {
    let alive = true;

    fetch("/api/landing-content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && Array.isArray(data) && data.length > 0) {
          setEntries(data.filter((entry) => entry.isVisible !== false).sort((a, b) => a.sortOrder - b.sortOrder));
        }
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadQuotes() {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        const data = await res.json();
        const source = Array.isArray(data) ? data : Array.isArray(data?.quotes) ? data.quotes : [];
        const nextQuotes = source
          .map((item: Record<string, unknown>) => ({
            symbol: String(item.symbol || item.name || ""),
            price: Number(item.price || item.bid || item.ask || 0),
            changePercent: Number(item.changePercent || item.percent || item.change || 0),
            market: String(item.market || item.category || ""),
          }))
          .filter((item: QuoteCard) => item.symbol && Number.isFinite(item.price) && item.price > 0)
          .slice(0, 6);
        if (alive && nextQuotes.length > 0) setQuotes(nextQuotes);
      } catch {
        if (alive) setQuotes(fallbackQuotes);
      }
    }

    loadQuotes();
    const timer = window.setInterval(loadQuotes, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const byKey = useMemo(() => new Map(entries.map((entry) => [entry.key, entry])), [entries]);
  const hero = byKey.get("hero");
  const stats = byKey.get("stats");
  const advantages = byKey.get("advantages");
  const markets = byKey.get("markets");
  const platform = byKey.get("platform");
  const accounts = byKey.get("accounts");
  const calculator = byKey.get("calculator");
  const calendar = byKey.get("calendar");
  const education = byKey.get("education");
  const banner = byKey.get("banner");
  const news = byKey.get("news");
  const articles = byKey.get("articles");
  const faq = byKey.get("faq");
  const reviews = byKey.get("reviews");
  const cta = byKey.get("cta");
  const footer = byKey.get("footer");
  const seo = byKey.get("seo");
  const isRu = language === "ru";

  useEffect(() => {
    if (!seo) return;
    const seoData = parseData<{ keywordsRu?: string; keywordsEn?: string; ogImage?: string }>(seo, {});
    const nextTitle = text(seo, "title", language);
    const nextDescription = text(seo, "body", language);
    const nextKeywords = isRu ? seoData.keywordsRu : seoData.keywordsEn;
    if (nextTitle) document.title = nextTitle;
    updateMeta("description", nextDescription);
    updateMeta("keywords", nextKeywords || "");
    updateMetaProperty("og:title", nextTitle);
    updateMetaProperty("og:description", nextDescription);
    updateMetaProperty("og:image", seoData.ogImage || "/images/pwa/astero-icon-512.png");
  }, [language, seo, isRu]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#04110b] text-white">
      <Hero entry={hero} stats={stats} quotes={quotes} language={language} />
      <QuoteStrip quotes={quotes} language={language} />
      <CardsSection id="advantages" entry={advantages} language={language} accent="emerald" />
      <MarketOverview entry={markets} quotes={quotes} language={language} />
      <PlatformSection entry={platform} language={language} />
      <AccountsSection entry={accounts} language={language} />
      <CalculatorSection entry={calculator} language={language} />
      <CalendarSection entry={calendar} language={language} />
      <CardsSection id="education" entry={education} language={language} accent="lime" />
      <BannerSection entry={banner} language={language} />
      <NewsSection entry={news} language={language} />
      <ArticlesSection entry={articles} language={language} />
      <FaqSection entry={faq} language={language} />
      <ReviewsSection entry={reviews} language={language} />
      <CtaSection entry={cta} language={language} />
      <FooterSection entry={footer} language={language} />
      <div className="border-t border-white/10 bg-black/30 px-5 py-4 text-center text-xs text-white/45">
        {isRu
          ? "Операции на финансовых рынках связаны с риском. Информация на сайте не является индивидуальной инвестиционной рекомендацией."
          : "Financial market operations involve risk. Website information is not an individual investment recommendation."}
      </div>
    </main>
  );
}

function HeaderNav() {
  const { language } = useLanguage();
  const nav = language === "ru"
    ? [
        ["Преимущества", "#advantages"],
        ["Рынки", "#markets"],
        ["Счета", "#accounts"],
        ["FAQ", "#faq"],
      ]
    : [
        ["Advantages", "#advantages"],
        ["Markets", "#markets"],
        ["Accounts", "#accounts"],
        ["FAQ", "#faq"],
      ];

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Astero">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-slate-950 shadow-lg shadow-emerald-900/30">
          A
        </span>
        <span>
          <span className="block text-lg font-black leading-none tracking-tight">Astero</span>
          <span className="block text-[10px] font-black uppercase tracking-[0.32em] text-emerald-300">Trader Room</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-bold text-white/70 lg:flex">
        {nav.map(([label, href]) => (
          <a key={href} href={href} className="transition hover:text-white">
            {label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white/80 transition hover:border-emerald-300 hover:text-white">
          {language === "ru" ? "Войти" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}

function Hero({ entry, stats, quotes, language }: { entry?: LandingEntry; stats?: LandingEntry; quotes: QuoteCard[]; language: "ru" | "en" }) {
  const data = parseData<{ eyebrowRu?: string; eyebrowEn?: string; primaryCtaRu?: string; primaryCtaEn?: string; secondaryCtaRu?: string; secondaryCtaEn?: string }>(entry, {});
  const statData = parseData<{ items?: { value: string; ru: string; en: string }[] }>(stats, { items: [] });
  const isRu = language === "ru";

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(52,211,153,0.24),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(163,230,53,0.18),transparent_28%),linear-gradient(135deg,#04110b_0%,#092015_48%,#020604_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="absolute left-1/2 top-28 hidden h-[520px] w-[1180px] -translate-x-1/2 opacity-55 lg:block">
        <HeroChart />
      </div>
      <HeaderNav />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-86px)] w-full max-w-7xl flex-col justify-center px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-5 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            {isRu ? data.eyebrowRu : data.eyebrowEn}
          </p>
          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
            {text(entry, "title", language)}
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-emerald-50/76 sm:text-xl">
            {text(entry, "body", language)}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="rounded-2xl bg-emerald-400 px-6 py-4 text-center text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:bg-lime-300">
              {isRu ? data.primaryCtaRu : data.primaryCtaEn}
            </Link>
            <Link href="/signup" className="rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-center text-sm font-black text-white backdrop-blur transition hover:border-emerald-300/50 hover:bg-white/12">
              {isRu ? data.secondaryCtaRu : data.secondaryCtaEn}
            </Link>
          </div>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(statData.items || []).slice(0, 4).map((item) => (
            <div key={`${item.value}-${item.ru}`} className="rounded-2xl border border-emerald-300/18 bg-white/[0.075] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-3xl font-black text-emerald-300">{item.value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/55">{isRu ? item.ru : item.en}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {quotes.slice(0, 3).map((quote) => (
            <div key={quote.symbol} className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="font-black">{quote.symbol}</span>
                <span className={quote.changePercent && quote.changePercent < 0 ? "text-red-300" : "text-emerald-300"}>
                  {(quote.changePercent || 0).toFixed(2)}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black">{priceLabel(quote)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteStrip({ quotes, language }: { quotes: QuoteCard[]; language: "ru" | "en" }) {
  return (
    <section className="border-y border-white/10 bg-[#07180f]/95 px-4 py-5 backdrop-blur" id="markets">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="lg:w-56">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">{language === "ru" ? "Живые котировки" : "Live quotes"}</p>
          <p className="mt-1 text-sm text-white/55">{language === "ru" ? "Ключевые рынки" : "Key markets"}</p>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {quotes.slice(0, 6).map((quote) => (
            <div key={quote.symbol} className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-xs font-black text-white/55">{quote.market || "Market"}</p>
              <p className="mt-1 font-black">{quote.symbol}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-lg font-black">{priceLabel(quote)}</span>
                <span className={`text-xs font-black ${quote.changePercent && quote.changePercent < 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {(quote.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardsSection({ id, entry, language, accent }: { id: string; entry?: LandingEntry; language: "ru" | "en"; accent: "emerald" | "lime" }) {
  const data = parseData<{ items?: Array<{ ruTitle: string; enTitle: string; ruText: string; enText: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id={id} eyebrow={isRu ? "Astero" : "Astero"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data.items || []).map((item, index) => (
          <div key={`${item.enTitle}-${index}`} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-emerald-300/35">
            <div className={`mb-6 flex size-12 items-center justify-center rounded-2xl ${accent === "emerald" ? "bg-emerald-400" : "bg-lime-300"} text-lg font-black text-slate-950`}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="text-xl font-black">{isRu ? item.ruTitle : item.enTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-white/62">{isRu ? item.ruText : item.enText}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function MarketOverview({ entry, quotes, language }: { entry?: LandingEntry; quotes: QuoteCard[]; language: "ru" | "en" }) {
  const isRu = language === "ru";
  const leaders = [...quotes].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 3);
  const laggards = [...quotes].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 3);

  return (
    <SectionShell id="overview" eyebrow={isRu ? "Обзор рынка" : "Market overview"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black">{isRu ? "Настроение рынка" : "Market sentiment"}</h3>
            <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">{isRu ? "Активно" : "Active"}</span>
          </div>
          <div className="h-64 rounded-2xl border border-emerald-300/15 bg-[#07150f] p-4">
            <MiniMarketChart />
          </div>
        </div>
        <div className="grid gap-4">
          <MarketList title={isRu ? "Лидеры роста" : "Top movers"} items={leaders} />
          <MarketList title={isRu ? "Под давлением" : "Under pressure"} items={laggards} negative />
        </div>
      </div>
    </SectionShell>
  );
}

function MarketList({ title, items, negative = false }: { title: string; items: QuoteCard[]; negative?: boolean }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
      <h3 className="font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${title}-${item.symbol}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-4 py-3">
            <span className="font-black">{item.symbol}</span>
            <span className={negative ? "text-red-300" : "text-emerald-300"}>{(item.changePercent || 0).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ items?: Array<{ ruTitle: string; enTitle: string; ruText: string; enText: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="platform" eyebrow={isRu ? "Технологии" : "Technology"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-emerald-300/16 bg-emerald-300/[0.075] p-5 shadow-2xl shadow-emerald-950/25 backdrop-blur">
          <div className="mb-4 flex items-center gap-4 rounded-3xl border border-emerald-300/15 bg-black/20 p-4">
            <img
              src="/images/pwa/astero-icon-512.png"
              alt={isRu ? "Логотип Astero Trader Room" : "Astero Trader Room logo"}
              className="size-16 rounded-2xl object-cover shadow-lg shadow-emerald-950/30"
              loading="lazy"
            />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{isRu ? "Единая экосистема" : "Unified ecosystem"}</p>
              <p className="mt-1 text-sm leading-6 text-white/62">{isRu ? "Кабинет, терминал и CRM работают как один продукт." : "Cabinet, terminal and CRM work as one product."}</p>
            </div>
          </div>
          <TerminalPreview />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(data.items || []).map((item) => (
            <div key={item.enTitle} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur">
              <h3 className="text-lg font-black">{isRu ? item.ruTitle : item.enTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{isRu ? item.ruText : item.enText}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function AccountsSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ items?: Array<{ name: string; deposit: string; ruText: string; enText: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="accounts" eyebrow={isRu ? "Счета" : "Accounts"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 lg:grid-cols-4">
        {(data.items || []).map((account, index) => (
          <div key={account.name} className={`rounded-3xl border p-6 backdrop-blur ${index === 2 ? "border-emerald-300/45 bg-emerald-300/[0.11]" : "border-white/10 bg-white/[0.055]"}`}>
            <p className="text-2xl font-black">{account.name}</p>
            <p className="mt-2 text-sm font-black text-emerald-300">{account.deposit}</p>
            <p className="mt-6 text-sm leading-6 text-white/64">{isRu ? account.ruText : account.enText}</p>
            <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-300">
              {isRu ? "Перейти в кабинет" : "Open cabinet"}
            </Link>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function CalculatorSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ minMonthlyRate?: number; maxMonthlyRate?: number; defaultAmount?: number }>(entry, { minMonthlyRate: 0.15, maxMonthlyRate: 0.3, defaultAmount: 5000 });
  const [amount, setAmount] = useState(data.defaultAmount || 5000);
  const min = amount * (data.minMonthlyRate || 0.15);
  const max = amount * (data.maxMonthlyRate || 0.3);
  const isRu = language === "ru";

  return (
    <SectionShell id="calculator" eyebrow={isRu ? "Калькулятор" : "Calculator"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div>
          <label className="text-sm font-black text-white/70">{isRu ? "Сумма на счете, EUR" : "Account amount, EUR"}</label>
          <input
            value={amount}
            min={0}
            type="number"
            onChange={(event) => setAmount(Math.max(0, Number(event.target.value || 0)))}
            className="mt-3 h-16 w-full rounded-2xl border border-emerald-300/20 bg-black/30 px-5 text-3xl font-black text-white outline-none focus:border-emerald-300"
          />
        </div>
        <div className="rounded-3xl bg-emerald-300 p-6 text-slate-950">
          <p className="text-sm font-black uppercase tracking-[0.18em] opacity-70">{isRu ? "Примерный диапазон в месяц" : "Estimated monthly range"}</p>
          <p className="mt-4 text-4xl font-black">EUR {min.toFixed(0)} - {max.toFixed(0)}</p>
          <p className="mt-4 text-sm font-bold opacity-70">{isRu ? "Это ориентировочный расчет, а не обещание доходности." : "This is an indicative calculation, not a promise of return."}</p>
        </div>
      </div>
    </SectionShell>
  );
}

function CalendarSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ items?: Array<{ time: string; country: string; ruEvent: string; enEvent: string; impact?: string; ruImpact?: string; enImpact?: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="calendar" eyebrow={isRu ? "События" : "Events"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] backdrop-blur">
        {(data.items || []).map((item, index) => (
          <div key={`${item.time}-${item.country}`} className={`grid gap-3 px-5 py-4 text-sm sm:grid-cols-[90px_90px_1fr_120px] ${index > 0 ? "border-t border-white/10" : ""}`}>
            <span className="font-black text-emerald-300">{item.time}</span>
            <span className="font-black">{item.country}</span>
            <span className="text-white/78">{isRu ? item.ruEvent : item.enEvent}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-center text-xs font-black text-white/70">
              {isRu ? item.ruImpact || item.impact || "Средняя" : item.enImpact || (item.impact === "Высокая" ? "High" : "Medium")}
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function BannerSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{
    image?: string;
    altRu?: string;
    altEn?: string;
    points?: Array<{ ru: string; en: string }>;
  }>(entry, { points: [] });
  const isRu = language === "ru";

  return (
    <section id="banner" className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(255,255,255,0.06))] p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div className="flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/25 p-8">
          <img
            src={data.image || "/images/pwa/astero-icon-512.png"}
            alt={isRu ? data.altRu || "Визуальный знак Astero" : data.altEn || "Astero visual mark"}
            className="h-48 w-48 rounded-[2rem] object-cover shadow-2xl shadow-black/35 sm:h-64 sm:w-64"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{isRu ? "Премиальный продукт" : "Premium product"}</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{text(entry, "title", language)}</h2>
          <p className="mt-5 text-base leading-8 text-white/68">{text(entry, "body", language)}</p>
          <div className="mt-7 grid gap-3">
            {(data.points || []).map((point, index) => (
              <div key={`${point.en}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-300 text-xs font-black text-slate-950">{index + 1}</span>
                <span className="text-sm font-bold text-white/78">{isRu ? point.ru : point.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{
    items?: Array<{
      date: string;
      categoryRu: string;
      categoryEn: string;
      titleRu: string;
      titleEn: string;
      textRu: string;
      textEn: string;
    }>;
  }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="news" eyebrow={isRu ? "Рынок" : "Markets"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 lg:grid-cols-3">
        {(data.items || []).map((item, index) => (
          <article key={`${item.titleEn}-${index}`} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur transition hover:border-emerald-300/35">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">{isRu ? item.categoryRu : item.categoryEn}</span>
              <span className="text-xs font-bold text-white/42">{item.date}</span>
            </div>
            <h3 className="mt-5 text-xl font-black leading-tight">{isRu ? item.titleRu : item.titleEn}</h3>
            <p className="mt-4 text-sm leading-6 text-white/62">{isRu ? item.textRu : item.textEn}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function ArticlesSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{
    items?: Array<{
      timeRu: string;
      timeEn: string;
      titleRu: string;
      titleEn: string;
      textRu: string;
      textEn: string;
    }>;
  }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="articles" eyebrow={isRu ? "Обучение" : "Education"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 md:grid-cols-3">
        {(data.items || []).map((item, index) => (
          <article key={`${item.titleEn}-${index}`} className="rounded-3xl border border-white/10 bg-[#07180f] p-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{isRu ? item.timeRu : item.timeEn}</span>
              <span className="text-3xl font-black text-white/10">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="text-xl font-black leading-tight">{isRu ? item.titleRu : item.titleEn}</h3>
            <p className="mt-4 text-sm leading-6 text-white/62">{isRu ? item.textRu : item.textEn}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function FaqSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ items?: Array<{ ruQ: string; enQ: string; ruA: string; enA: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="faq" eyebrow="FAQ" title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-3">
        {(data.items || []).map((item) => (
          <details key={item.enQ} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
            <summary className="cursor-pointer list-none font-black text-white">{isRu ? item.ruQ : item.enQ}</summary>
            <p className="mt-3 text-sm leading-6 text-white/62">{isRu ? item.ruA : item.enA}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function ReviewsSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{ items?: Array<{ name: string; country: string; rating: number; ruText: string; enText: string }> }>(entry, { items: [] });
  const isRu = language === "ru";

  return (
    <SectionShell id="reviews" eyebrow={isRu ? "Клиенты" : "Clients"} title={text(entry, "title", language)} body={text(entry, "body", language)}>
      <div className="grid gap-4 lg:grid-cols-3">
        {(data.items || []).map((item) => (
          <div key={`${item.name}-${item.country}`} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black">{item.name}</p>
                <p className="text-xs font-bold text-white/45">{item.country}</p>
              </div>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">{item.rating}.0</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/68">{isRu ? item.ruText : item.enText}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function CtaSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const data = parseData<{
    primaryHref?: string;
    secondaryHref?: string;
    primaryRu?: string;
    primaryEn?: string;
    secondaryRu?: string;
    secondaryEn?: string;
  }>(entry, {});
  const isRu = language === "ru";

  return (
    <section id="cta" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.28),transparent_32%),linear-gradient(135deg,#0b2418,#04110b)] p-7 text-center shadow-2xl shadow-black/25 sm:p-12">
        <h2 className="mx-auto max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{text(entry, "title", language)}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/68">{text(entry, "body", language)}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={data.primaryHref || "/login"} className="rounded-2xl bg-emerald-300 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-lime-300">
            {isRu ? data.primaryRu || "Войти в кабинет" : data.primaryEn || "Enter cabinet"}
          </Link>
          <Link href={data.secondaryHref || "/signup"} className="rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-sm font-black text-white transition hover:border-emerald-300/50">
            {isRu ? data.secondaryRu || "Оставить заявку" : data.secondaryEn || "Create request"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function FooterSection({ entry, language }: { entry?: LandingEntry; language: "ru" | "en" }) {
  const isRu = language === "ru";
  const data = parseData<{ email?: string }>(entry, {});

  return (
    <footer className="bg-[#020604] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-slate-950">A</span>
            <span className="text-2xl font-black">{text(entry, "title", language)}</span>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">{text(entry, "body", language)}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FooterLink href="/login" label={isRu ? "Вход в кабинет" : "Cabinet login"} />
          <FooterLink href="/signup" label={isRu ? "Регистрация" : "Registration"} />
          <FooterLink href="#advantages" label={isRu ? "Преимущества" : "Advantages"} />
          <FooterLink href="#accounts" label={isRu ? "Типы счетов" : "Account types"} />
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/70 sm:col-span-2">{data.email || "support@astero.online"}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/70 transition hover:border-emerald-300/40 hover:text-white">
      {label}
    </Link>
  );
}

function SectionShell({ id, eyebrow, title, body, children }: { id: string; eyebrow: string; title: string; body: string; children: ReactNode }) {
  return (
    <section id={id} className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">{eyebrow}</p>
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-white sm:text-5xl">{title}</h2>
          {body && <p className="mt-5 text-base leading-8 text-white/62">{body}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function HeroChart() {
  const candles = [24, 32, 28, 44, 38, 52, 47, 61, 56, 70, 66, 78, 72, 82, 76, 88, 80, 92, 86, 98, 91, 104];
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-300/40" />
      <div className="absolute inset-0 flex items-end justify-center gap-5 px-16">
        {candles.map((height, index) => (
          <div key={index} className="relative flex h-72 w-4 items-end justify-center">
            <span className="absolute bottom-0 h-full w-px bg-emerald-300/30" />
            <span
              className={`w-4 rounded-full ${index % 3 === 0 ? "bg-lime-300" : "bg-emerald-400"} shadow-lg shadow-emerald-300/20`}
              style={{ height: `${height}%`, opacity: 0.42 + index / 60 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMarketChart() {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:42px_42px]" />
      <svg viewBox="0 0 640 230" className="relative h-full w-full" role="img" aria-label="Market chart">
        <path d="M0 180 C80 170 98 125 156 140 C220 162 234 62 300 82 C362 102 380 44 444 68 C502 90 520 40 640 48" fill="none" stroke="#34d399" strokeWidth="5" />
        <path d="M0 180 C80 170 98 125 156 140 C220 162 234 62 300 82 C362 102 380 44 444 68 C502 90 520 40 640 48 L640 230 L0 230Z" fill="url(#chartFill)" opacity="0.35" />
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function TerminalPreview() {
  const rows = [
    ["EUR/USD", "BUY", "1.08521", "+124.30"],
    ["XAU/USD", "SELL", "2325.40", "+82.10"],
    ["US100", "BUY", "19840.00", "-18.50"],
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050d09] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Astero terminal</p>
          <p className="mt-1 text-xl font-black">Live workspace</p>
        </div>
        <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">LIVE</span>
      </div>
      <div className="h-52 rounded-2xl border border-emerald-300/10 bg-black/30 p-3">
        <MiniMarketChart />
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        {rows.map((row) => (
          <div key={row[0]} className="grid grid-cols-4 border-b border-white/10 px-3 py-3 text-xs last:border-b-0">
            <span className="font-black">{row[0]}</span>
            <span className={row[1] === "BUY" ? "text-emerald-300" : "text-red-300"}>{row[1]}</span>
            <span className="text-white/60">{row[2]}</span>
            <span className={row[3].startsWith("+") ? "text-emerald-300" : "text-red-300"}>{row[3]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
