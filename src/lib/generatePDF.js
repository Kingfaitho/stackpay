import { jsPDF } from 'jspdf'

function safeAmount(amount) {
  return `NGN ${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function drawModernInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl) {
  const green = [0, 168, 85]
  const dark = [26, 28, 24]
  const grey = [90, 98, 85]
  const light = [245, 245, 242]
  const white = [255, 255, 255]
  const border = [220, 218, 210]

  // White background
  doc.setFillColor(...white)
  doc.rect(0, 0, 210, 297, 'F')

  // Top green header bar
  doc.setFillColor(...green)
  doc.rect(0, 0, 210, 38, 'F')

  // Logo area (top left in header)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 14, 6, 26, 26)
    } catch {
      // fallback to text logo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...white)
      doc.text(businessName?.[0]?.toUpperCase() || 'S', 27, 24)
    }
  } else {
    // Circle logo placeholder
    doc.setFillColor(...white)
    doc.circle(27, 19, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...green)
    doc.text(businessName?.[0]?.toUpperCase() || 'S', 27, 23, { align: 'center' })
  }

  // Business name in header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...white)
  doc.text(businessName || 'Your Business', 48, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 235, 215)
  doc.text(ownerName || '', 48, 24)

  // INVOICE label right side
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...white)
  doc.text('INVOICE', 196, 17, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 235, 215)
  doc.text(invoice.invoice_number, 196, 25, { align: 'right' })

  // Status badge
  const isPaid = invoice.status === 'paid'
  doc.setFillColor(...(isPaid ? [0, 168, 85] : [245, 166, 35]))
  doc.roundedRect(155, 28, 40, 9, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...white)
  doc.text(isPaid ? 'PAID' : 'UNPAID', 175, 34, { align: 'center' })

  // Info section
  let y = 52

  // Bill To block
  doc.setFillColor(...light)
  doc.roundedRect(14, y - 4, 86, 32, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...grey)
  doc.text('BILL TO', 20, y + 2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...dark)
  doc.text(clientName || 'Client', 20, y + 10)

  // Date block
  doc.setFillColor(...light)
  doc.roundedRect(110, y - 4, 86, 32, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...grey)
  doc.text('ISSUE DATE', 116, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...dark)
  doc.text(
    new Date(invoice.created_at).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    116, y + 10
  )

  if (invoice.due_date) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...grey)
    doc.text('DUE DATE', 116, y + 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    doc.text(
      new Date(invoice.due_date).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      116, y + 26
    )
  }

  // Items table
  y = 98

  // Table header
  doc.setFillColor(...dark)
  doc.rect(14, y, 182, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...white)
  doc.text('DESCRIPTION', 20, y + 7)
  doc.text('QTY', 120, y + 7, { align: 'right' })
  doc.text('UNIT PRICE', 152, y + 7, { align: 'right' })
  doc.text('TOTAL', 196, y + 7, { align: 'right' })

  y += 10

  // Items
  const items = invoice.items || []
  items.forEach((item, i) => {
    const isEven = i % 2 === 0
    if (isEven) {
      doc.setFillColor(248, 249, 246)
      doc.rect(14, y, 182, 11, 'F')
    }

    const qty = Number(item.quantity || 1)
    const price = Number(item.price || 0)
    const lineTotal = qty * price
    const desc = String(item.description || '').substring(0, 45)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    doc.text(desc, 20, y + 7.5)

    doc.text(String(qty), 120, y + 7.5, { align: 'right' })
    doc.text(safeAmount(price), 152, y + 7.5, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.text(safeAmount(lineTotal), 196, y + 7.5, { align: 'right' })

    y += 11
  })

  // Totals section
  y += 6
  doc.setDrawColor(...border)
  doc.setLineWidth(0.4)
  doc.line(100, y, 196, y)
  y += 8

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text('Subtotal', 130, y)
  doc.setTextColor(...dark)
  doc.text(safeAmount(invoice.subtotal || invoice.total), 196, y, { align: 'right' })
  y += 8

  // Tax if exists
  if (Number(invoice.tax) > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...grey)
    doc.text('VAT (7.5%)', 130, y)
    doc.setTextColor(184, 122, 0)
    doc.text(`+ ${safeAmount(invoice.tax)}`, 196, y, { align: 'right' })
    y += 8
  }

  // Total box
  doc.setFillColor(...green)
  doc.roundedRect(100, y, 96, 14, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...white)
  doc.text('TOTAL DUE', 110, y + 9)
  doc.setFontSize(12)
  doc.text(safeAmount(invoice.total), 192, y + 9, { align: 'right' })
  y += 22

  // Notes
  if (invoice.notes) {
    doc.setFillColor(...light)
    doc.roundedRect(14, y, 182, 24, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...grey)
    doc.text('NOTES', 20, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    const lines = doc.splitTextToSize(invoice.notes, 168)
    doc.text(lines, 20, y + 15)
    y += 30
  }

  // Footer
  doc.setFillColor(...light)
  doc.rect(0, 272, 210, 25, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('Generated by StackPay — stackpay.ng', 14, 283)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...green)
  doc.text('Thank you for your business!', 196, 283, { align: 'right' })
}

function drawDarkInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl) {
  const green = [0, 168, 85]
  const dark = [8, 12, 10]
  const dark2 = [20, 26, 22]
  const grey = [138, 158, 146]
  const white = [240, 245, 242]

  // Dark background
  doc.setFillColor(...dark)
  doc.rect(0, 0, 210, 297, 'F')

  // Header bar
  doc.setFillColor(...dark2)
  doc.rect(0, 0, 210, 45, 'F')

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 14, 8, 22, 22)
    } catch {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...green)
      doc.text(businessName?.[0]?.toUpperCase() || 'S', 25, 24)
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...white)
  doc.text(businessName || 'Business', logoDataUrl ? 42 : 20, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text(ownerName || '', logoDataUrl ? 42 : 20, 28)

  // Invoice number right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('INVOICE', 196, 16, { align: 'right' })
  doc.setFontSize(11)
  doc.setTextColor(...green)
  doc.text(invoice.invoice_number, 196, 26, { align: 'right' })

  // Status
  const isPaid = invoice.status === 'paid'
  doc.setFillColor(...(isPaid ? [0, 80, 40] : [80, 60, 0]))
  doc.roundedRect(152, 30, 44, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...(isPaid ? green : [245, 166, 35]))
  doc.text(isPaid ? '✓  PAID' : 'UNPAID', 174, 37, { align: 'center' })

  let y = 60

  // Bill To
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...grey)
  doc.text('BILL TO', 14, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...white)
  doc.text(clientName || 'Client', 14, y + 9)

  // Dates right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...grey)
  doc.text('ISSUED', 150, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...white)
  doc.text(
    new Date(invoice.created_at).toLocaleDateString('en-NG'),
    150, y + 8
  )

  if (invoice.due_date) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...grey)
    doc.text('DUE', 150, y + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...white)
    doc.text(
      new Date(invoice.due_date).toLocaleDateString('en-NG'),
      150, y + 24
    )
  }

  // Divider
  doc.setDrawColor(...green)
  doc.setLineWidth(0.5)
  doc.line(14, y + 18, 196, y + 18)
  y += 28

  // Table header
  doc.setFillColor(...dark2)
  doc.rect(14, y, 182, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('DESCRIPTION', 20, y + 7)
  doc.text('QTY', 118, y + 7, { align: 'right' })
  doc.text('PRICE', 152, y + 7, { align: 'right' })
  doc.text('TOTAL', 196, y + 7, { align: 'right' })
  y += 10

  // Items
  const items = invoice.items || []
  items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(15, 21, 16)
      doc.rect(14, y, 182, 11, 'F')
    }

    const qty = Number(item.quantity || 1)
    const price = Number(item.price || 0)
    const desc = String(item.description || '').substring(0, 45)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...white)
    doc.text(desc, 20, y + 7.5)
    doc.text(String(qty), 118, y + 7.5, { align: 'right' })
    doc.setTextColor(...grey)
    doc.text(safeAmount(price), 152, y + 7.5, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...white)
    doc.text(safeAmount(qty * price), 196, y + 7.5, { align: 'right' })
    y += 11
  })

  y += 8
  doc.setDrawColor(...green)
  doc.setLineWidth(0.3)
  doc.line(120, y, 196, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text('Subtotal', 130, y)
  doc.setTextColor(...white)
  doc.text(safeAmount(invoice.subtotal || invoice.total), 196, y, { align: 'right' })
  y += 8

  if (Number(invoice.tax) > 0) {
    doc.text('VAT (7.5%)', 130, y)
    doc.setTextColor(245, 166, 35)
    doc.text(`+ ${safeAmount(invoice.tax)}`, 196, y, { align: 'right' })
    y += 8
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...green)
  doc.text('TOTAL DUE', 130, y)
  doc.text(safeAmount(invoice.total), 196, y, { align: 'right' })
  y += 16

  if (invoice.notes) {
    doc.setFillColor(...dark2)
    doc.roundedRect(14, y, 182, 22, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...grey)
    doc.text('NOTES', 20, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...white)
    const lines = doc.splitTextToSize(invoice.notes, 165)
    doc.text(lines, 20, y + 15)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('Generated by StackPay — stackpay.ng', 14, 285)
  doc.setTextColor(...green)
  doc.text('Thank you for your business!', 196, 285, { align: 'right' })
}

function drawMinimalInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl) {
  const accent = [201, 168, 76]
  const dark = [26, 28, 24]
  const grey = [120, 125, 115]
  const border = [220, 218, 210]
  const white = [255, 255, 255]
  const lightgold = [250, 247, 238]

  doc.setFillColor(...white)
  doc.rect(0, 0, 210, 297, 'F')

  // Gold left stripe
  doc.setFillColor(...accent)
  doc.rect(0, 0, 6, 297, 'F')

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 20, 18, 24, 24)
    } catch {}
  }

  const textX = logoDataUrl ? 50 : 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...dark)
  doc.text(businessName || 'Business', textX, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text(ownerName || '', textX, 36)

  // INVOICE top right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...accent)
  doc.text('INVOICE', 196, 30, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text(invoice.invoice_number, 196, 38, { align: 'right' })

  // Thin gold divider
  doc.setDrawColor(...accent)
  doc.setLineWidth(1.5)
  doc.line(20, 48, 196, 48)

  let y = 60

  // Bill To + Dates
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('BILL TO', 20, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...dark)
  doc.text(clientName || 'Client', 20, y + 9)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('DATE', 140, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...dark)
  doc.text(
    new Date(invoice.created_at).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    140, y + 9
  )

  if (invoice.due_date) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...grey)
    doc.text('DUE', 140, y + 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    doc.text(
      new Date(invoice.due_date).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      140, y + 27
    )
  }

  y += 30

  // Status
  const isPaid = invoice.status === 'paid'
  doc.setFillColor(...(isPaid ? [232, 248, 238] : [255, 248, 225]))
  doc.roundedRect(20, y, 40, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...(isPaid ? [0, 100, 50] : [140, 90, 0]))
  doc.text(isPaid ? 'PAID' : 'UNPAID', 40, y + 7, { align: 'center' })
  y += 18

  // Items table
  doc.setFillColor(...dark)
  doc.rect(20, y, 176, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...white)
  doc.text('DESCRIPTION', 26, y + 7)
  doc.text('QTY', 115, y + 7, { align: 'right' })
  doc.text('PRICE', 150, y + 7, { align: 'right' })
  doc.text('AMOUNT', 196, y + 7, { align: 'right' })
  y += 10

  const items = invoice.items || []
  items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...lightgold)
      doc.rect(20, y, 176, 11, 'F')
    }

    const qty = Number(item.quantity || 1)
    const price = Number(item.price || 0)
    const desc = String(item.description || '').substring(0, 45)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    doc.text(desc, 26, y + 7.5)
    doc.text(String(qty), 115, y + 7.5, { align: 'right' })
    doc.setTextColor(...grey)
    doc.text(safeAmount(price), 150, y + 7.5, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text(safeAmount(qty * price), 196, y + 7.5, { align: 'right' })
    y += 11
  })

  y += 6
  doc.setDrawColor(...border)
  doc.setLineWidth(0.4)
  doc.line(110, y, 196, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grey)
  doc.text('Subtotal', 120, y)
  doc.setTextColor(...dark)
  doc.text(safeAmount(invoice.subtotal || invoice.total), 196, y, { align: 'right' })
  y += 8

  if (Number(invoice.tax) > 0) {
    doc.text('VAT (7.5%)', 120, y)
    doc.setTextColor(140, 90, 0)
    doc.text(`+ ${safeAmount(invoice.tax)}`, 196, y, { align: 'right' })
    y += 8
  }

  doc.setFillColor(...accent)
  doc.roundedRect(110, y, 86, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 28, 24)
  doc.text('TOTAL DUE', 120, y + 9)
  doc.text(safeAmount(invoice.total), 192, y + 9, { align: 'right' })
  y += 22

  if (invoice.notes) {
    doc.setDrawColor(...border)
    doc.setLineWidth(0.4)
    doc.rect(20, y, 176, 22, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...grey)
    doc.text('NOTES', 26, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    const lines = doc.splitTextToSize(invoice.notes, 162)
    doc.text(lines, 26, y + 16)
  }

  doc.setFillColor(...lightgold)
  doc.rect(0, 272, 210, 25, 'F')
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.5)
  doc.line(0, 272, 210, 272)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grey)
  doc.text('Generated by StackPay — stackpay.ng', 20, 283)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accent)
  doc.text('Thank you for your business!', 196, 283, { align: 'right' })
}

export async function generateInvoicePDF(invoice, clientName, businessName, ownerName, style = 'modern', logoDataUrl = null) {
  const doc = new jsPDF()

  switch (style) {
    case 'dark':
      drawDarkInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl)
      break
    case 'minimal':
      drawMinimalInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl)
      break
    default:
      drawModernInvoice(doc, invoice, clientName, businessName, ownerName, logoDataUrl)
  }

  doc.save(`${invoice.invoice_number}.pdf`)
}

export function generatePaymentUrl(invoiceId) {
  return `${window.location.origin}/pay/${invoiceId}`
}