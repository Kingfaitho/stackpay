# NRS/FIRS E-Invoicing: Where Ledga Stands and the Path to Full Compliance

Last updated: June 2026

## The mandate (why this matters)

Since 1 January 2026, every VAT-registered Nigerian business, regardless of
size, must issue invoices through the national e-invoicing system run by the
FIRS (transitioning to the Nigerian Revenue Service, NRS). Invoices must be
structured electronic documents (Peppol BIS Billing 3.0, UBL format, XML or
JSON), validated by the national platform (the Merchant Buyer Solution, MBS).

For millions of SMEs this is confusing and unserved. An invoicing tool that
makes compliance invisible is the single strongest selling point Ledga can own.

## What Ledga has today (shipped)

- `src/lib/generateUBL.js` produces a Peppol BIS Billing 3.0 (UBL 2.1)
  XML document for any invoice: supplier with TIN, customer, VAT 7.5%
  treatment (or zero-rated), line items, monetary totals.
- Every invoice row has a "e-Invoice" download button (Invoices page).
- Profile has a TIN field (Tax Identification Number) used in the XML.

What this gives users now: a structured e-invoice file they can keep, share
with accountants, or upload wherever FIRS/NRS accepts documents.

## What we must NOT do

Do not market Ledga as "NRS compliant" or "FIRS certified" anywhere until we
are actually onboarded. The honest current wording is: "Export structured
e-invoices (UBL) ready for Nigeria's e-invoicing standard."

## Path to full compliance (the build plan)

1. **Register interest with FIRS/NRS e-invoicing programme.** The platform
   has an onboarding process for taxpayers and for "access point" /
   integration partners. Decide: integrate directly (Ledga as system
   integrator) or through an accredited access point provider (faster).
2. **Get API credentials** for the sandbox MBS environment.
3. **Server-side submission**: new edge function `submit-einvoice` that takes
   an invoice, builds the UBL (port generateUBL to the function), signs and
   transmits to the MBS API, stores the returned IRN/QR/validation stamp on
   the invoice row.
4. **Surface the stamp**: paid/sent invoices show their validation reference
   and QR on the PDF and the payment page.
5. **Then** market it: "Every Ledga invoice is NRS e-invoicing ready."

## Data we still need from users for full validity

- TIN (done, Profile field)
- Business address (done, Profile field)
- For B2B: the buyer's TIN (add optional TIN field to Clients later)

## References

- FIRS e-invoicing guidance and the 2026 rollout for medium/small taxpayers
- Peppol BIS Billing 3.0: https://docs.peppol.eu/poacc/billing/3.0/
- Nigeria uses UBL invoice (XML/JSON) per the FIRS technical specs
