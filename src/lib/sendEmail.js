import { supabase } from '../supabaseClient'

// Receipt emails are sent server-side (Supabase edge function) so the email
// API key never ships in the browser bundle. Online payments trigger receipts
// automatically inside verify-payment; this is for manual mark-as-paid.
export async function sendInvoicePaidEmail({ invoiceId }) {
  try {
    await supabase.functions.invoke('send-receipt', { body: { invoiceId } })
  } catch (err) {
    console.error('Receipt send failed:', err)
  }
}
