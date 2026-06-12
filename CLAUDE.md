# Ledga

Fintech SaaS for Nigerian small businesses: invoicing with Paystack payment links, expense and profit tracking, cash flow forecasting, WhatsApp collections, AI advisor, and a business credit score.

Mission: **Know your real profit. Get paid faster. Grow with clarity.**

See GOALS.md for the full roadmap, market research, and what we must achieve.

## Stack

- React 19 + Vite 8 (rolldown), plain JSX, no TypeScript
- React Router 7, all routes in `src/App.jsx` (lazy-loaded except LandingPage)
- Supabase (auth + database), client in `src/supabaseClient.js`
- Paystack for payments (`src/lib/paystack.js`), jsPDF for invoices, Recharts for charts
- Deployed on Vercel

## Commands

- `npm run dev` - dev server
- `npm run build` - production build
- `npm run lint` - eslint

WSL note: node_modules is installed from Windows. Before building under WSL run:
`npm i --no-save @rolldown/binding-linux-x64-gnu@<rolldown version in node_modules>`

## Design system (do not deviate)

- Fonts: Syne (display/headings), DM Sans (body). Loaded in `src/styles/global.css`.
- Dark theme: near-black `#060908`, green `#00C566`, gold `#C9A84C`, purple `#7C6AF7` accents.
- Light theme: warm white `#F8F6F1`, deep green `#007A3D`, gold accent. Tokens live in `src/context/ThemeContext.jsx` (JS) and `global.css` (CSS vars); keep both in sync.
- Styling is inline-style based with `useTheme()` colors; `global.css` holds tokens, keyframes, and responsive overrides.
- Icons: Lucide only. Never use emojis as UI icons.
- Animations: 150-300ms transitions, fadeUp/reveal on scroll (`src/components/Reveal.jsx` + `.reveal` CSS). Always respect `prefers-reduced-motion` (handled globally in global.css).
- Currency: always Naira via `Intl.NumberFormat('en-NG', { currency: 'NGN' })`.
- Do not use em dashes in copy or code comments. Use a plain hyphen or reword.

## Conventions

- Pages: `src/pages` (public) and `src/pages/app` (protected, wrapped in `AppLayout`).
- New routes must be lazy-loaded in `App.jsx` and wrapped in `ProtectedRoute` if authenticated.
- WhatsApp sharing uses `https://wa.me/<234...>?text=` links; Nigerian numbers convert `0xxxxxxxxxx` to `234xxxxxxxxx`.
- Public links NEVER use row ids. Payment links are `/pay/<invoice.public_token>`, portal links are `/portal/<client.public_token>` (uuid tokens). Public pages read data only through the token-gated RPCs in `supabase/rls-policies.sql`; there is no anonymous table access.
- Money-state writes (invoice paid, plan active) happen only in edge functions (`verify-payment`, `verify-subscription`) after confirming with Paystack. Never trust the browser callback.
- Copy voice: speaks to Nigerian business owners, plain language, no corporate jargon, product is live (never "waitlist" or "early access").

## What's next (June 2026)

Full roadmap lives in GOALS.md. The immediate queue, in order:

### Owner actions (blocked on Kingfaitho, not code)

1. Resend (resend.com): rotate the API key (the old one shipped in past browser
   bundles), update the RESEND_API_KEY secret in Supabase, delete the unused
   VITE_RESEND_API_KEY from Vercel env, and verify the ledga.ng domain so
   receipt emails actually deliver.
2. Paystack verification: follow docs/paystack-verification.md. Until it
   clears, collect by bank transfer + Mark as Paid (receipts auto-send).
   Go-live is a two-key swap, no code changes.
3. NRS e-invoicing onboarding: register with FIRS/NRS or an accredited access
   point per docs/nrs-einvoicing.md. Never market "NRS compliant" before this.

### Build queue (next features, in priority order)

1. **Scheduled reminder automation**: Supabase cron (pg_cron) + edge function
   that finds overdue invoices nightly and emails the client a payment link
   (WhatsApp Business API later). Reminders go out even when the owner is
   offline. This monetizes Collections and needs no external approval.
2. **Buyer TIN on Clients**: optional TIN field flowing into generateUBL.js so
   B2B e-invoices are fully valid. Small, finishes the e-invoicing story.
3. **Offline-tolerant core**: extend the existing PWA service worker to cache
   the dashboard and invoice drafts, sync on reconnect. Data is expensive;
   competitors are offline-first.
4. **USD payment links**: promised on the Pricing page, so either ship it
   (needs Paystack USD approval, blocked on verification) or soften the
   pricing copy until it exists. Do not leave a broken promise live.
5. **Payment provider abstraction**: wrap Paystack behind one interface so
   Monnify/Korapay can slot in as alternatives later.
6. **Real trust proof on landing**: when available, CAC business name in the
   footer, verified Paystack badge, real customer stories with names and
   numbers. Never fabricate testimonials or stats.

## Git

- Commits are authored by Kingfaitho only. Never add Co-Authored-By trailers or AI attribution to commits.
