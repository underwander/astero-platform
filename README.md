# Financial disputes landing

Production-ready лендинг юридической практики по финансовым спорам. Обращения принимаются через единственную модальную форму и сохраняются до отправки во внешние системы.

## Архитектура заявок

```text
Lead Form → /api/leads → LeadService → LeadRepository → PostgreSQL
                                      └→ transactional outbox
                                          ├→ CRM webhook
                                          ├→ Telegram Bot
                                          └→ SMTP Email
```

- `src/modules/leads/domain` — модель заявки и каналы доставки.
- `src/modules/leads/application` — Service Layer и интерфейсы Repository/Integration.
- `src/modules/leads/infrastructure/postgres` — PostgreSQL Repository.
- `src/modules/leads/infrastructure/integrations` — независимые CRM, Telegram и Email адаптеры.
- `src/modules/leads/composition.ts` — единственная точка сборки зависимостей.
- `database/migrations` — SQL-схема заявок и transactional outbox.

Supabase совместим без отдельного SDK: используйте PostgreSQL connection string из Supabase. Для serverless-развёртывания рекомендуется Supabase transaction pooler.

## Подключение базы

1. Скопируйте `.env.example` в `.env.local`.
2. Заполните `DATABASE_URL`.
3. Для Supabase/PostgreSQL с обязательным TLS оставьте `DATABASE_SSL_MODE=require`. Для локальной базы можно использовать `disable`.
4. Выполните:

```bash
npm run db:migrate
```

Команда последовательно применяет все SQL-файлы из `database/migrations`, проверяет их контрольные суммы и сохраняет историю в `app_schema_migrations`. Заявка и задания интеграций сохраняются одной транзакцией.

## Интеграции

Интеграции включаются только переменными окружения. React-компоненты и API-контракт формы менять не требуется.

### CRM

```env
CRM_WEBHOOK_URL=https://crm.example.com/webhooks/leads
CRM_WEBHOOK_TOKEN=
```

CRM получает событие `lead.created` с версией payload `1`.

### Telegram Bot

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Бота необходимо добавить в целевой чат и предоставить право отправки сообщений.

### Email

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
LEAD_NOTIFICATION_EMAIL=
```

Поддерживается любой SMTP-провайдер. Для порта `465` защищённый режим включается автоматически.

## Повторная доставка

Защищённый endpoint обрабатывает outbox:

```http
POST /api/internal/lead-deliveries
Authorization: Bearer <INTEGRATION_CRON_SECRET>
```

Его следует вызывать планировщиком методом `POST` каждые 1–5 минут. Максимум восемь попыток; задержка увеличивается от одной минуты до одного часа.

## Запуск

```bash
npm install
npm run dev
```

Для публикации также заполните `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME`, `LEGAL_OPERATOR_NAME`, `LEGAL_CONTACT_EMAIL` и `RATE_LIMIT_SECRET`. До подключения домена, юридических реквизитов, распределённого ограничения запросов и базы сайт закрывается от индексации.

## Проверка

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run audit:prod
```
