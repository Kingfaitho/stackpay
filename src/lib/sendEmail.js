export async function sendInvoicePaidEmail({
  ownerEmail,
  ownerName,
  businessName,
  clientName,
  invoiceNumber,
  amount,
}) {
  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

  const body = {
    from: 'StackPay <notifications@stackpay.ng>',
    to: ownerEmail,
    subject: `💰 Invoice ${invoiceNumber} has been paid!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060908; color: #EDF2EF; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; color: #EDF2EF; margin: 0;">
            Stack<span style="color: #00C566;">Pay</span>
          </h1>
        </div>
        <div style="background: #111815; border: 1px solid rgba(0,197,102,0.2); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
          <h2 style="color: #00C566; font-size: 24px; margin: 0 0 8px 0;">
            Payment Received!
          </h2>
          <p style="color: #7A9485; margin: 0;">
            ${clientName} has paid invoice ${invoiceNumber}
          </p>
        </div>
        <div style="background: #111815; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #7A9485;">Business</span>
            <span style="color: #EDF2EF; font-weight: 700;">${businessName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #7A9485;">Client</span>
            <span style="color: #EDF2EF; font-weight: 700;">${clientName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #7A9485;">Invoice</span>
            <span style="color: #EDF2EF; font-weight: 700;">${invoiceNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06);">
            <span style="color: #7A9485;">Amount Paid</span>
            <span style="color: #00C566; font-weight: 800; font-size: 20px;">
              ₦${Number(amount).toLocaleString()}
            </span>
          </div>
        </div>
        <p style="color: #4A6055; font-size: 12px; text-align: center; margin: 0;">
          Sent by StackPay — stackpay-five.vercel.app
        </p>
      </div>
    `,
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }
}
