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

## Git

- Commits are authored by Kingfaitho only. Never add Co-Authored-By trailers or AI attribution to commits.
