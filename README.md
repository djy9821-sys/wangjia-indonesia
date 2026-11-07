# WANGJIA® Indonesia — official store, admin and app

Commerce stack for selling **WANGJIA paddle‑wheel aerators (kincir air)** to shrimp and fish farms in Indonesia.
Customers order from a native app or the web, pay in IDR by instalments (Midtrans or bank transfer), finance
confirms the money, and only then the warehouse ships. 中文说明见 [README.zh-CN.md](README.zh-CN.md)。

<p align="center"><img src="brand/wangjia-logo.svg" alt="WANGJIA" width="360"></p>

## What is inside

| Folder | What | Stack |
|---|---|---|
| `apps/backend` | API, admin dashboard, workflows, jobs | [Medusa v2](https://medusajs.com) (B2B starter) + custom modules |
| `apps/storefront` | Web store (Indonesian) with the same payment-plan page | Next.js 15 |
| `apps/mobile` | Customer app: catalogue, cart, quotes, instalments, receipts, tracking, push, QR warranty check, map pin for delivery | Flutter |
| `deploy/` | One-VPS production stack: Postgres, Redis, Caddy HTTPS, Uptime Kuma, Umami, backups; separate Chatwoot and GlitchTip stacks | Docker Compose |
| `brand/` | Placeholder logo assets until the official files arrive | SVG/PNG |
| `infra/` | Local Postgres without Docker/Homebrew (embedded‑postgres) | Node |

### Business flow

```
browse → order or request a quote → sales creates a payment plan (deposit / balance)
→ customer pays (Midtrans Snap in-app, or bank transfer + receipt upload)
→ finance confirms → order released → warehouse fulfils & ships (freight tracking)
→ customer follows everything in the app; WhatsApp / email / push at each step
```

Key backend pieces (all under `apps/backend/src`):

- **`modules/payment-plan`** — plans, instalments, receipts, refunds; release policy `deposit_paid` or `full_paid`.
- **Fulfilment gate** — orders cannot be fulfilled until finance released them; order edits are locked while a plan is active.
- **Midtrans** — Snap transactions per instalment, verified webhook, refunds through the gateway.
- **Roles** — owner / sales / finance / warehouse in admin user metadata, managed on the 团队角色 page.
- **Notifications** — WhatsApp Cloud API, Resend email and FCM push providers (dry‑run to the log without keys).
- **Jobs** — expire unpaid plans, daily payment reminders.
- **Invoices** — proforma / invoice PDF with PPN, signed 24h download links.
- **Indonesian regions** — 38 provinces / 514 regencies / 7,285 districts served from `data/wilayah.json`.
- **`modules/warranty`** — serial numbers + QR codes per unit; public genuine check, in‑app warranty registration, scan counts as a counterfeit signal, CSV for label printing.
- **Tracking** — `/store/orders/:id/tracking` with carrier history through Biteship when `BITESHIP_API_KEY` is set.
- **Error reporting** — Sentry‑compatible (`SENTRY_DSN`), self‑hosted GlitchTip compose in `deploy/`.

## Quick start (local)

Requirements: Node ≥ 22.23.4, pnpm 9.15, PostgreSQL 15+ (or `cd infra && npm i && node pg.js`), Flutter 3.47+ for the app.

```bash
pnpm install
cp apps/backend/.env.template apps/backend/.env       # set DATABASE_URL, JWT_SECRET, COOKIE_SECRET
cd apps/backend && pnpm medusa db:migrate             # runs migrations + Indonesian seed (prints the publishable key)
pnpm medusa user -e boss@example.com -p supersecret
pnpm dev                                              # admin at http://localhost:9000/app
```

Storefront: copy `apps/storefront/.env.template` to `.env.local`, set the publishable key and `NEXT_PUBLIC_DEFAULT_REGION=id`, then `pnpm dev` (http://localhost:8000). App: see [`apps/mobile/README.md`](apps/mobile/README.md).

Tests (backend HTTP integration, needs Postgres on `localhost`):

```bash
cd apps/backend && DB_HOST=localhost DB_USERNAME=postgres DB_PASSWORD=postgres pnpm test:integration:http
```

## Configuration

Everything external is opt‑in through `apps/backend/.env` (see `.env.template`): Midtrans keys, WhatsApp Cloud API,
Resend, Firebase service account, S3/R2 storage, Redis, company details for invoices, OTP and rate‑limit knobs.
Without keys the system still runs end‑to‑end; outbound messages are logged instead of sent.

## Deploy

See [`deploy/README.md`](deploy/README.md) — `docker compose up -d --build` on a single VPS with automatic HTTPS.

## License

MIT for the code in this repository (see `LICENSE`). WANGJIA® and company names belong to their owners.
