// Shared receipt emails, sent server-side through Resend.
// Used by verify-payment (online payments) and send-receipt (manual marks).

interface ReceiptData {
  invoiceNumber: string
  amount: number
  businessName: string
  ownerEmail?: string | null
  clientName?: string | null
  clientEmail?: string | null
}

const naira = (n: number) => `NGN ${Number(n).toLocaleString('en-NG')}`

const shell = (inner: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060908; color: #EDF2EF; padding: 40px; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; color: #EDF2EF; margin: 0;">
        Led<span style="color: #00C566;">ga</span>
      </h1>
    </div>
    ${inner}
    <p style="color: #4A6055; font-size: 12px; text-align: center; margin: 24px 0 0;">
      Sent by Ledga - financial tools for Nigerian businesses
    </p>
  </div>`

const row = (label: string, value: string, strong = false) => `
  <table width="100%" style="margin-bottom: 12px;"><tr>
    <td style="color: #7A9485;">${label}</td>
    <td align="right" style="color: ${strong ? '#00C566' : '#EDF2EF'}; font-weight: ${strong ? 800 : 700}; ${strong ? 'font-size: 20px;' : ''}">${value}</td>
  </tr></table>`

async function sendEmail(resendKey: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'Ledga <notifications@ledga.ng>', to, subject, html }),
    })
    if (!res.ok) console.error('Resend error:', res.status, await res.text())
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

// Receipt to the paying client + payment alert to the business owner.
// Failures are logged, never thrown: a receipt hiccup must not break payment.
export async function sendReceiptEmails(resendKey: string, d: ReceiptData) {
  const tasks: Promise<void>[] = []

  if (d.clientEmail) {
    tasks.push(sendEmail(
      resendKey,
      d.clientEmail,
      `Receipt: ${d.invoiceNumber} from ${d.businessName}`,
      shell(`
        <div style="background: #111815; border: 1px solid rgba(0,197,102,0.2); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #00C566; font-size: 24px; margin: 0 0 8px 0;">Payment Received</h2>
          <p style="color: #7A9485; margin: 0;">This is your receipt. Keep it for your records.</p>
        </div>
        <div style="background: #111815; border-radius: 12px; padding: 24px;">
          ${row('From', d.businessName)}
          ${row('Invoice', d.invoiceNumber)}
          ${row('Status', 'PAID')}
          ${row('Amount Paid', naira(d.amount), true)}
        </div>`),
    ))
  }

  if (d.ownerEmail) {
    tasks.push(sendEmail(
      resendKey,
      d.ownerEmail,
      `You got paid: ${d.invoiceNumber} (${naira(d.amount)})`,
      shell(`
        <div style="background: #111815; border: 1px solid rgba(0,197,102,0.2); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #00C566; font-size: 24px; margin: 0 0 8px 0;">Payment Received</h2>
          <p style="color: #7A9485; margin: 0;">${d.clientName || 'A client'} has paid invoice ${d.invoiceNumber}</p>
        </div>
        <div style="background: #111815; border-radius: 12px; padding: 24px;">
          ${row('Business', d.businessName)}
          ${row('Client', d.clientName || 'Client')}
          ${row('Invoice', d.invoiceNumber)}
          ${row('Amount Paid', naira(d.amount), true)}
        </div>`),
    ))
  }

  await Promise.all(tasks)
}
