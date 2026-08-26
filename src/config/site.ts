const publicUrlValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const publicUrl = publicUrlValue?.replace(/\/+$/, "");
const publicBrandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim();
const operatorName = process.env.LEGAL_OPERATOR_NAME?.trim();
const contactEmailValue = process.env.LEGAL_CONTACT_EMAIL?.trim();
const contactEmail = contactEmailValue?.includes("@") ? contactEmailValue : null;
const registrationDetails = process.env.LEGAL_REGISTRATION_DETAILS?.trim();
const configuredLastUpdated = process.env.SITE_LAST_UPDATED?.trim();
const analyticsId = (value: string | undefined, pattern: RegExp) => {
  const normalized = value?.trim();
  return normalized && pattern.test(normalized) ? normalized : null;
};

export const siteConfig = {
  name: "Юридическая помощь по финансовым спорам",
  shortName: publicBrandName || "Финансовые споры",
  domain: publicUrl || "http://localhost:3000",
  locale: "ru-RU",
  language: "ru-RU",
  operatorName: operatorName || null,
  legal: {
    contactEmail,
    registrationDetails: registrationDetails || null,
  },
  navigation: [
    { label: "Споры", href: "/#services" },
    { label: "Рассмотрение", href: "/#process" },
    { label: "Сопровождение", href: "/#advantages" },
    { label: "Вопросы", href: "/#faq" },
  ],
  cta: {
    primary: { label: "Передать ситуацию на анализ" },
    secondary: { label: "Описать финансовый спор" },
  },
  seo: {
    title: "Юридическая помощь по финансовым спорам",
    description:
      "Правовой анализ и юридическое сопровождение споров с брокерами, банками, инвестиционными платформами, платёжными и криптовалютными сервисами.",
    lastUpdated:
      configuredLastUpdated && !Number.isNaN(Date.parse(configuredLastUpdated)) ? configuredLastUpdated : null,
  },
  analytics: {
    gtmId: analyticsId(process.env.NEXT_PUBLIC_GTM_ID, /^GTM-[A-Z0-9]+$/),
    gaId: analyticsId(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]+$/),
    googleAdsId: analyticsId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, /^AW-\d+$/),
    googleAdsLabel: analyticsId(process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL, /^[A-Za-z0-9_-]+$/),
    metaPixelId: analyticsId(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d+$/),
  },
} as const;

export const isLaunchReady = Boolean(
  publicUrl &&
  publicBrandName &&
  operatorName &&
  contactEmail &&
  process.env.DATABASE_URL &&
  process.env.RATE_LIMIT_SECRET,
);
