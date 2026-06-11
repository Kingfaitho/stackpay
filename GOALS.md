# Ledga: Where We Are and Where We Are Going

Last updated: June 2026

## Mission

**Know your real profit. Get paid faster. Grow with clarity.**

Ledga is the financial brain for Nigerian small businesses. Owners who earn well but cannot explain where the money goes open Ledga and see, in one screen: what they earned, what they kept, who owes them, and how long their business can survive.

## Where we are (shipped)

- Landing page with live signup, luxury green/gold design, scroll-reveal animations
- 4-step onboarding that ends with a real invoice and a WhatsApp payment link
- Invoicing + Paystack payment links (Naira), PDF generation, client portal
- Expense tracking, profit dashboard, cash flow forecast, budget, reports
- Collections Engine: escalating WhatsApp reminders (gentle, firm, urgent) that
  persist history and escalate automatically when reminders are ignored
- Client reliability scores feeding a business credit score
- AI advisor (Supabase edge function), POS, inventory, work orders, team, recurring
- PWA install prompt, dark/light themes, route-level code splitting

## What the Nigerian market is hungry for (research, June 2026)

1. **NRS/FIRS mandatory e-invoicing.** Since January 2026 every VAT-registered
   business must issue structured e-invoices through the national system
   (Peppol BIS 3.0 UBL, XML/JSON). Millions of SMEs have no simple tool for this.
   This is our single biggest wedge: "send an invoice that is also compliant."
2. **WhatsApp-native money workflows.** WhatsApp is the real commerce channel.
   Invoicing and payments are still disconnected from chat. Every flow we ship
   should end in a WhatsApp-ready message.
3. **The invoice gap (late payments).** Late payment is the number one SME
   cash-flow killer. Owners chase debtors manually. Automated, escalating,
   polite-but-firm collections is a feature people will pay for.
4. **Offline and low bandwidth.** Competitors (Moniepoint Moniebook) are
   offline-first. Data is expensive; bundles must stay small, core flows must
   tolerate flaky networks.
5. **Credit access.** Only about 12% of SMEs get financing from banks. A credit
   score built from real invoice/payment history becomes valuable the moment a
   lending partner accepts it.
6. **New tax regime positioning.** Small companies (turnover up to 100M naira,
   fixed assets up to 250M) are now exempt from CIT, CGT and the development
   levy. We hold the data to tell an owner "you qualify" for free.

Key competitive facts: bookkeeping alone monetizes poorly (Kippa pivoted away);
payments and compliance are where revenue lives. Moniepoint charges 6K-8.5K
naira/month for Moniebook; our Growth plan at 3,500 naira/month undercuts it.

## What we must achieve (roadmap, in order)

### Now (weeks)

- [ ] Keep initial JS bundle small; audit chunks after every feature (done: route splitting)
- [ ] Reminder nudges on Dashboard: "3 invoices need chasing" deep link to Collections
- [ ] Receipt auto-send on payment confirmation (WhatsApp + email)
- [ ] Tax-exemption banner: detect turnover under thresholds and tell the owner

### Next (1-2 months)

- [ ] **NRS e-invoicing compliance**: generate Peppol UBL (XML/JSON) alongside our
      PDF, submit through the FIRS/NRS API or an accredited access point partner.
      Market as "NRS-ready invoicing." Do not claim compliance until certified.
- [ ] Scheduled reminder automation: server-side (Supabase cron + WhatsApp Business
      API or email fallback) so reminders go out even when the owner is offline
- [ ] Offline-tolerant core: cache dashboard + invoice drafts locally, sync on
      reconnect (PWA service worker already exists; extend it)
- [ ] USD payment links (already promised on the pricing page; must ship before
      anyone pays for Growth)

### Later (3-6 months)

- [ ] WhatsApp Business API bot: create an invoice by chatting ("invoice Emeka 150k
      for logo design")
- [ ] Lending partnership: make the Ledga credit score actionable with a real
      loan offer pipeline
- [ ] Inventory + POS offline mode for retail
- [ ] Multi-business support and team roles (Business plan promises)
- [ ] Monthly auto-generated financial report PDF (Business plan promise)

## Principles

- Every feature must answer one of: am I profitable? will I get paid? will I survive?
- Ship flows that end in WhatsApp.
- Never claim compliance, security, or partnerships we do not have.
- The product is live. No waitlist language anywhere.
- Luxury feel, cheap data: beautiful but light.
