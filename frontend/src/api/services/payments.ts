import axios from '@/api/axios';

export interface PaymentIntent {
  client_secret: string;
  intent_id: string;
  amount: number;
  currency: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at?: string;
  payment_method: string;
}

export interface PaymentsList {
  payments: Payment[];
  outstanding: number;
  total_paid: number;
}

/**
 * Erstelle Payment Intent für eine Rechnung
 */
export async function createPaymentIntent(invoiceId: number): Promise<PaymentIntent> {
  const response = await axios.post('/payments/create-intent', {
    invoice_id: invoiceId,
  });
  return response.data;
}

/**
 * Bestätige eine Zahlung nach Stripe-Verarbeitung
 */
export async function confirmPayment(
  invoiceId: number,
  intentId: string
): Promise<Payment> {
  const response = await axios.post('/payments/confirm', {
    invoice_id: invoiceId,
    intent_id: intentId,
  });
  return response.data.payment;
}

/**
 * Liste Zahlungen für eine Rechnung
 */
export async function getPaymentsList(invoiceId: number): Promise<PaymentsList> {
  const response = await axios.get(`/payments/invoice/${invoiceId}`);
  return response.data;
}

/**
 * Erstate eine Zahlung
 */
export async function refundPayment(
  paymentId: number,
  amount?: number
): Promise<Payment> {
  const response = await axios.post(`/payments/${paymentId}/refund`, {
    amount,
  });
  return response.data.payment;
}
