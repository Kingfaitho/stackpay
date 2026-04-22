export function initializePayment({
  email, amount, invoiceNumber, onSuccess, onClose
}) {
  const handler = window.PaystackPop.setup({
    key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100,
    currency: 'NGN',
    ref: `STACKPAY-${invoiceNumber}-${Date.now()}`,
    metadata: {
      invoice_number: invoiceNumber,
    },
    callback: (response) => onSuccess(response),
    onClose: () => onClose && onClose(),
  })
  handler.openIframe()
}
