import "server-only";

const optional = (value: string | undefined) => value?.trim() || null;
const parsedPoolSize = Number(process.env.DATABASE_POOL_MAX || 5);
const parsedSmtpPort = Number(process.env.SMTP_PORT || 587);
const sslMode = process.env.DATABASE_SSL_MODE;

export const serverConfig = {
  security: {
    rateLimitSecret: optional(process.env.RATE_LIMIT_SECRET),
  },
  database: {
    url: optional(process.env.DATABASE_URL),
    sslMode: sslMode === "disable" || sslMode === "verify-full" ? sslMode : "require",
    poolMax: Number.isInteger(parsedPoolSize) && parsedPoolSize > 0 ? parsedPoolSize : 5,
  },
  integrations: {
    cronSecret: optional(process.env.INTEGRATION_CRON_SECRET),
    crm: {
      url: optional(process.env.CRM_WEBHOOK_URL),
      token: optional(process.env.CRM_WEBHOOK_TOKEN),
    },
    telegram: {
      botToken: optional(process.env.TELEGRAM_BOT_TOKEN),
      chatId: optional(process.env.TELEGRAM_CHAT_ID),
    },
    email: {
      host: optional(process.env.SMTP_HOST),
      port: Number.isInteger(parsedSmtpPort) && parsedSmtpPort > 0 ? parsedSmtpPort : 587,
      secure: process.env.SMTP_SECURE === "true" || parsedSmtpPort === 465,
      user: optional(process.env.SMTP_USER),
      password: process.env.SMTP_PASSWORD || undefined,
      from: optional(process.env.EMAIL_FROM),
      to: optional(process.env.LEAD_NOTIFICATION_EMAIL),
    },
  },
} as const;
