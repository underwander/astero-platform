import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export type LandingContentKind =
  | "hero"
  | "stats"
  | "cards"
  | "accounts"
  | "banner"
  | "news"
  | "articles"
  | "calendar"
  | "calculator"
  | "faq"
  | "reviews"
  | "cta"
  | "footer"
  | "seo";

export type LandingContentEntry = {
  id?: string;
  key: string;
  titleRu: string;
  titleEn: string;
  bodyRu: string;
  bodyEn: string;
  kind: LandingContentKind;
  dataJson: string;
  isVisible: boolean;
  sortOrder: number;
  updatedAt?: string | Date;
  createdAt?: string | Date;
};

let landingContentReady: Promise<void> | null = null;

export const defaultLandingContent: LandingContentEntry[] = [
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
    bodyRu: "Ключевые показатели сервиса обновляются через CRM и отображаются на лендинге без изменения кода.",
    bodyEn: "Key service indicators are managed through CRM and shown on the landing page without code changes.",
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
    bodyRu: "Forex, металлы, криптовалюты, индексы и акции собраны в интерфейсе, адаптированном под ежедневную работу.",
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
    bodyRu: "Расчет является примером и не гарантирует будущую прибыль. Итог зависит от рыночной ситуации и принятых решений.",
    bodyEn: "The calculation is an example and does not guarantee future profit. Results depend on market conditions and decisions.",
    dataJson: JSON.stringify({ minMonthlyRate: 0.15, maxMonthlyRate: 0.3, defaultAmount: 5000 }),
  },
  {
    key: "education",
    kind: "cards",
    sortOrder: 80,
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
    key: "calendar",
    kind: "calendar",
    sortOrder: 90,
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
        { ruQ: "Где посмотреть операции?", enQ: "Where can I see operations?", ruA: "История пополнений и выводов доступна в панели клиента и профильных разделах.", enA: "Deposit and withdrawal history is available in the client dashboard and related sections." },
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
    dataJson: JSON.stringify({ email: "support@astero.online", address: "Astero Digital Workspace" }),
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

function normalizeEntry(entry: LandingContentEntry): LandingContentEntry {
  return {
    ...entry,
    kind: entry.kind || "cards",
    dataJson: entry.dataJson || "{}",
    isVisible: entry.isVisible !== false,
    sortOrder: Number.isFinite(Number(entry.sortOrder)) ? Number(entry.sortOrder) : 0,
  };
}

export function parseLandingData<T>(entry: LandingContentEntry | undefined, fallback: T): T {
  if (!entry?.dataJson) return fallback;
  try {
    return JSON.parse(entry.dataJson) as T;
  } catch {
    return fallback;
  }
}

export function mergeLandingContent(entries: LandingContentEntry[]) {
  const map = new Map(defaultLandingContent.map((entry) => [entry.key, normalizeEntry(entry)]));
  entries.forEach((entry) => map.set(entry.key, normalizeEntry(entry)));
  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function ensureLandingContentTable() {
  landingContentReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "LandingContent" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "titleRu" TEXT NOT NULL DEFAULT '',
      "titleEn" TEXT NOT NULL DEFAULT '',
      "bodyRu" TEXT NOT NULL DEFAULT '',
      "bodyEn" TEXT NOT NULL DEFAULT '',
      "kind" TEXT NOT NULL DEFAULT 'cards',
      "dataJson" TEXT NOT NULL DEFAULT '{}',
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(async () => {
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "LandingContent_key_key" ON "LandingContent" ("key")`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "titleRu" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "titleEn" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "bodyRu" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "bodyEn" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'cards'`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "dataJson" TEXT NOT NULL DEFAULT '{}'`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`;
    await prisma.$executeRaw`ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  });

  return landingContentReady;
}

export async function seedLandingContent() {
  await ensureLandingContentTable();

  for (const entry of defaultLandingContent) {
    await prisma.$executeRaw`
      INSERT INTO "LandingContent" ("id", "key", "titleRu", "titleEn", "bodyRu", "bodyEn", "kind", "dataJson", "isVisible", "sortOrder", "updatedAt")
      VALUES (${randomUUID()}, ${entry.key}, ${entry.titleRu}, ${entry.titleEn}, ${entry.bodyRu}, ${entry.bodyEn}, ${entry.kind}, ${entry.dataJson}, ${entry.isVisible}, ${entry.sortOrder}, NOW())
      ON CONFLICT ("key") DO NOTHING
    `;
  }
}

export async function getLandingContentRows(includeHidden = false) {
  await seedLandingContent();
  const rows = await prisma.$queryRaw<LandingContentEntry[]>`
    SELECT "id", "key", "titleRu", "titleEn", "bodyRu", "bodyEn", "kind", "dataJson", "isVisible", "sortOrder", "createdAt", "updatedAt"
    FROM "LandingContent"
    WHERE ${includeHidden} = true OR "isVisible" = true
    ORDER BY "sortOrder" ASC, "updatedAt" DESC
  `;

  return mergeLandingContent(rows);
}
