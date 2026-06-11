# Getting Paystack Out of Test Mode: Step-by-Step

Last updated: June 2026

## Why you are probably stuck

Yes - your guess is most likely right. The settlement bank account is the
usual blocker, and the rule depends on which business type you applied as:

- **Starter Business** (no CAC registration): the bank account MUST be a
  personal account in YOUR OWN legal name, exactly matching your BVN name.
  If your BVN says "Ugochukwu Innocent X" and the account says anything
  else (a nickname, a business alias, a different name order), it fails.
- **Registered Business** (CAC registered): the bank account MUST be a
  corporate account in the EXACT registered business name. A personal
  account will be rejected here - this is the classic mismatch. If you
  applied as Registered Business but submitted your personal account,
  that is the problem.

Other common blockers: blurry ID photo, ID name not matching BVN name,
unfinished profile sections, or a website/social link that does not clearly
show what the business does.

## Fix path A: Starter Business (fastest, no CAC needed)

Use this if Ledga (your business) is not yet CAC-registered.

1. Log in to dashboard.paystack.com
2. Go to Settings, then Business (or the "Activate Business" banner)
3. Make sure business type says "Starter Business"
4. Provide:
   - Your BVN
   - A government ID (NIN slip, driver licence, intl passport, or voter card)
     where the name matches your BVN name
   - A personal bank account in your own name (same name as BVN)
   - A short, honest business description and your website
     (your live Vercel URL works) or active social media page
5. Submit and wait. Typical review is 1 to 3 business days.

Starter Business limits to know: lower transaction caps and some features
(like subscriptions/plans) may be restricted until you upgrade to a
Registered Business. Payment links and standard collections work.

## Fix path B: Registered Business (full features)

Do this when ready - it unlocks higher limits and subscription billing,
which Ledga's Growth/Business plans use.

1. Register the business at cac.gov.ng (Business Name registration is the
   cheap, fast option; roughly N10,000-N25,000 via agents, a few days)
2. Open a corporate bank account in the exact registered name (most
   Nigerian banks; Moniepoint and OPay business accounts also work and
   are fast to open)
3. In Paystack: Settings, Business, switch/complete profile as
   "Registered Business" and upload:
   - CAC certificate (and status report for business names)
   - Proof of address (utility bill)
   - Director/proprietor ID matching CAC records
   - The corporate account for settlements
4. Submit. Review is usually a few days; respond quickly if they email
   asking for clarifications.

## If it stays stuck

- Email support@paystack.com from your registered email with your
  business name and a screenshot of the verification screen. They do
  reply and will say exactly which document failed.
- Do NOT create a second Paystack account. Verification is identity-bound;
  duplicates can flag both accounts.

## What works meanwhile (test mode playbook)

1. **Keep using Ledga fully.** Invoices, clients, expenses, reports,
   collections reminders - everything except real card payments works.
2. **Collect by bank transfer.** Put your account details in the invoice
   note, client transfers, you tap "Mark as Paid" - receipts now auto-send
   to you and the client by email, so the experience stays professional.
3. **Test the full payment flow safely.** In test mode use Paystack's test
   card (4084 0840 8408 4081, any future expiry, CVV 408) on your own
   payment links to confirm everything works end to end.
4. **When verification clears:** swap the keys and you are live -
   - Vercel env: set VITE_PAYSTACK_PUBLIC_KEY to the pk_live_... key, redeploy
   - Supabase secret: update PAYSTACK_SECRET_KEY to the sk_live_... key
   No code changes needed.
