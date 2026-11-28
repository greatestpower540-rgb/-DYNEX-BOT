# DYNEX BOT API Platform

## What this adds
- Developer signup/sign-in with PBKDF2 password hashing and secure HttpOnly session cookies.
- Developer API key creation/revocation. Full keys are displayed once; only SHA-256 hashes are stored.
- OpenAI-style `POST /v1/chat/completions` using the existing Gemini provider secret.
- `GET /v1/models`, monthly request quotas (Free: 1,000; Paid: 50,000).
- Owner-only developer listing and plan/status controls via `DYNEX_ADMIN_SECRET`.
- Static developer portal at `/developers.html`.

## Required Cloudflare setup
1. Create D1: `npx wrangler d1 create dynex-api-platform`.
2. Put the returned database ID in `worker/wrangler.toml` in place of `REPLACE_WITH_D1_DATABASE_ID`.
3. From the worker directory, apply schema: `npx wrangler d1 migrations apply dynex-api-platform --remote` (or execute `migrations/0001_api_platform.sql` with `wrangler d1 execute`).
4. Add Worker secret `DYNEX_ADMIN_SECRET` with a long random value.
5. Set Worker variable `DYNEX_ALLOWED_ORIGIN` to the exact origin that serves `developers.html`. If the portal is hosted on the same Worker, use that origin.
6. Keep the existing `GEMINI_API_KEY` secret. Never expose it to the browser or mobile app.
7. Deploy the Worker and host the root-level `developers.html`, `css/developers.css`, and `js/developers.js` with the existing website.

## Routes
- `POST /developers/register` — create free developer account.
- `POST /developers/login`, `POST /developers/logout`, `GET /developers/me`.
- `GET|POST /developers/keys`; `DELETE /developers/keys/:id`.
- `POST /v1/chat/completions` — requires `Authorization: Bearer dnx_live_...`.
- `GET /v1/models`.
- Owner routes: `GET /admin/api/developers`, `POST /admin/api/developers/:id` with `{ "plan":"paid", "status":"active" }` or free/suspended equivalents and Authorization Bearer admin secret.

## Plans and billing
Free is enabled on signup and includes 1,000 requests per UTC calendar month. Paid quota is 50,000 requests per month and must be activated by the platform owner using the protected admin route. No money is collected by this release: payment checkout, receipts, taxes, token-based metering and automatic subscription renewal are not implemented. Do not advertise paid billing as live until a payment provider is connected.

## Important deployment note
The D1 database binding is intentionally a placeholder until the database is created in the owner's Cloudflare account. The API endpoints return a clear 503 until the binding is configured. Existing `/chat` behavior is kept separate and unchanged.
