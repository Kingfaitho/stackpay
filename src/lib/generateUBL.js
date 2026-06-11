// Peppol BIS Billing 3.0 (UBL 2.1) e-invoice XML, the structured format
// Nigeria's NRS/FIRS e-invoicing system is built on. This produces the
// document; transmission to the national platform requires onboarding with
// an accredited access point (see docs/nrs-einvoicing.md).

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const money = (n) => Number(n || 0).toFixed(2)

export function buildUBLInvoice(invoice, profile, client) {
  const currency = 'NGN'
  const issueDate = invoice.issue_date
    || (invoice.created_at || new Date().toISOString()).split('T')[0]
  const items = Array.isArray(invoice.items) && invoice.items.length
    ? invoice.items
    : [{ description: 'Services', quantity: 1, price: invoice.subtotal ?? invoice.total }]

  const subtotal = items.reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0)
  const tax = Number(invoice.tax || 0)
  const hasVat = tax > 0
  const vatPercent = hasVat ? '7.5' : '0'
  const taxCategory = hasVat ? 'S' : 'Z'

  const lines = items.map((it, i) => {
    const qty = Number(it.quantity || 1)
    const price = Number(it.price || 0)
    return `
  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(qty * price)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(it.description || 'Item')}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${taxCategory}</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${money(price)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${esc(issueDate)}</cbc:IssueDate>${invoice.due_date ? `
  <cbc:DueDate>${esc(invoice.due_date)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>${invoice.notes ? `
  <cbc:Note>${esc(invoice.notes)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(profile?.business_name || 'Business')}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>${profile?.address ? `
        <cbc:StreetName>${esc(profile.address)}</cbc:StreetName>` : ''}
        <cac:Country><cbc:IdentificationCode>NG</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${profile?.tin ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(profile.tin)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(profile?.business_name || 'Business')}</cbc:RegistrationName>
      </cac:PartyLegalEntity>${profile?.email ? `
      <cac:Contact><cbc:ElectronicMail>${esc(profile.email)}</cbc:ElectronicMail></cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(client?.name || 'Customer')}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cac:Country><cbc:IdentificationCode>NG</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(client?.name || 'Customer')}</cbc:RegistrationName>
      </cac:PartyLegalEntity>${client?.email ? `
      <cac:Contact><cbc:ElectronicMail>${esc(client.email)}</cbc:ElectronicMail></cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${money(subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${taxCategory}</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${money(subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${money(subtotal + tax)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${money(Number(invoice.total || subtotal + tax))}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>
`
}

export function downloadUBLInvoice(invoice, profile, client) {
  const xml = buildUBLInvoice(invoice, profile, client)
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.invoice_number || 'invoice'}-einvoice.xml`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
