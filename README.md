# Astero Platform

Astero is a green brokerage-style trading cabinet with a separate administrator CRM.

## Main changes

- Astero branding and logo
- Green trading interface
- Separate admin CRM at `/crm`
- Client menu no longer shows CRM controls
- Deposit form with card / wallet / account details
- Withdrawal form with card / wallet / account destination
- More market groups: Forex, Metals, Crypto, Indices, Stocks
- Manual quote overrides from CRM
- Mobile-friendly client dashboard and terminal

## Local setup

Create `.env` in the project root:

```env
DATABASE_URL="your_neon_database_url"
TWELVE_DATA_API_KEY=your_twelve_data_key
RESEND_API_KEY=re_your_resend_key
EMAIL_FROM=Astero <onboarding@resend.dev>
```

Then run:

```bash
npm install
npx prisma db push
npx prisma generate
npm run dev
```

Client site:

```text
http://localhost:3000
```

Admin CRM:

```text
http://localhost:3000/crm
```

Only users with `role = ADMIN` can open `/crm`.
