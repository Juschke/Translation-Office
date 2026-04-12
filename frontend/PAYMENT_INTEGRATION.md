# Frontend Payment Integration Guide

Diese Anleitung beschreibt die Integration der Stripe Payment-Funktionalität im React-Frontend.

---

## 1. Installation

```bash
npm install @stripe/react-stripe-js @stripe/js
```

---

## 2. Stripe Provider Setup

### Erstelle `PaymentProvider.tsx`

```tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/js';
import React from 'react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function PaymentProvider({ children }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

### Wrap App mit Provider

```tsx
// In App.tsx oder main.tsx
import { PaymentProvider } from '@/components/PaymentProvider';

<PaymentProvider>
  <App />
</PaymentProvider>
```

---

## 3. API Service

### Erstelle `src/api/services/payments.ts`

```tsx
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
export async function confirmPayment(invoiceId: number, intentId: string): Promise<Payment> {
  const response = await axios.post('/payments/confirm', {
    invoice_id: invoiceId,
    intent_id: intentId,
  });
  return response.data.payment;
}

/**
 * Liste Zahlungen für eine Rechnung
 */
export async function getPaymentsList(invoiceId: number) {
  const response = await axios.get(`/payments/invoice/${invoiceId}`);
  return response.data;
}

/**
 * Erstate eine Zahlung
 */
export async function refundPayment(paymentId: number, amount?: number) {
  const response = await axios.post(`/payments/${paymentId}/refund`, {
    amount,
  });
  return response.data.payment;
}
```

---

## 4. Payment Modal Component

### Erstelle `src/components/modals/PaymentModal.tsx`

```tsx
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { confirmPayment, createPaymentIntent } from '@/api/services/payments';
import Modal from './Modal';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  invoiceId: number;
  amount: number;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function PaymentContent({ invoiceId, amount, currency, onClose, onSuccess }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const { data: intent, isLoading: intentLoading } = useQuery({
    queryKey: ['paymentIntent', invoiceId],
    queryFn: () => createPaymentIntent(invoiceId),
    enabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !intent) {
      return;
    }

    setIsLoading(true);

    try {
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            // Add billing details if needed
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Payment failed');
        return;
      }

      // Confirm payment on backend
      await confirmPayment(invoiceId, intent.intent_id);

      toast.success('Payment completed successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (intentLoading) {
    return <div className="text-center py-8">Loading payment information...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span>Amount:</span>
          <span className="font-medium">
            {amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

export function PaymentModal({
  isOpen,
  invoiceId,
  amount,
  currency,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment">
      <div className="min-w-[400px]">
        <Elements stripe={stripePromise}>
          <PaymentContent
            isOpen={isOpen}
            invoiceId={invoiceId}
            amount={amount}
            currency={currency}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Elements>
      </div>
    </Modal>
  );
}
```

---

## 5. Invoice Payment Status Component

### Erstelle `src/components/invoices/PaymentStatus.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { getPaymentsList } from '@/api/services/payments';
import { useState } from 'react';
import { PaymentModal } from '@/components/modals/PaymentModal';

interface PaymentStatusProps {
  invoiceId: number;
  amount: number;
  currency: string;
  status: string;
}

export function PaymentStatus({
  invoiceId,
  amount,
  currency,
  status,
}: PaymentStatusProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: paymentData, refetch } = useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: () => getPaymentsList(invoiceId),
  });

  const outstanding = paymentData?.outstanding || 0;
  const isPaid = status === 'paid' || outstanding <= 0;

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Payment Status</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">
            {(amount / 100).toFixed(2)} {currency}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Outstanding:</span>
          <span className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(outstanding / 100).toFixed(2)} {currency}
          </span>
        </div>

        {paymentData?.payments?.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Payment History:</p>
            <div className="space-y-1">
              {paymentData.payments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between text-xs">
                  <span>
                    {new Date(payment.paid_at).toLocaleDateString()}{' '}
                    <span className="text-gray-500">({payment.payment_method})</span>
                  </span>
                  <span className="font-medium">
                    {(payment.amount / 100).toFixed(2)} {payment.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isPaid && (
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Pay Invoice
        </button>
      )}

      {isPaid && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded text-sm text-center">
          ✓ Invoice paid
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        invoiceId={invoiceId}
        amount={amount / 100}
        currency={currency}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
```

---

## 6. Environment Configuration

### Erstelle `.env.local`

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=http://localhost:8000/api
```

---

## 7. WebSocket Real-Time Updates

### Abonniere Payment-Events

```tsx
import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export function usePaymentUpdates(tenantId: number, onPaymentSucceeded?: () => void) {
  useEffect(() => {
    const echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_KEY,
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = echo.private(`tenant.${tenantId}`);

    channel.listen('payment.succeeded', (data: any) => {
      toast.success(`Payment received: ${data.amount} ${data.currency}`);
      onPaymentSucceeded?.();
    });

    channel.listen('payment.failed', (data: any) => {
      toast.error(`Payment failed: ${data.error}`);
    });

    return () => {
      channel.stopListening('payment.succeeded');
      channel.stopListening('payment.failed');
      echo.leaveChannel(`tenant.${tenantId}`);
    };
  }, [tenantId, onPaymentSucceeded]);
}
```

---

## 8. Testing

### Mock Stripe Cards für Testing

```
Successful payment:  4242 4242 4242 4242
Failed payment:      4000 0000 0000 0002
Requires auth (3D):  4000 0025 0000 3155
```

### Test-Ablauf

1. Öffne Invoice
2. Klick "Pay Invoice"
3. Gib Test Card ein: 4242 4242 4242 4242
4. Beliebige Exp Date (z.B. 12/26) und CVC (z.B. 123)
5. Klick "Pay Now"
6. Zahlung sollte verarbeitet werden

---

## 9. Error Handling

```tsx
const cardElement = elements?.getElement(CardElement);

const result = await stripe?.confirmCardPayment(intent.client_secret);

if (result?.error) {
  const errorMessage = result.error.message;

  switch (result.error.code) {
    case 'card_declined':
      toast.error('Card was declined');
      break;
    case 'expired_card':
      toast.error('Card has expired');
      break;
    case 'invalid_expiry_month':
    case 'invalid_expiry_year':
      toast.error('Invalid expiration date');
      break;
    case 'invalid_cvc':
      toast.error('Invalid CVC');
      break;
    default:
      toast.error(errorMessage);
  }
}
```

---

## 10. Production Checklist

- [ ] Use live Stripe keys (not test keys)
- [ ] Enable 3D Secure for compliance
- [ ] Implement proper error handling
- [ ] Add HTTPS/TLS everywhere
- [ ] Set up webhook signature verification
- [ ] Enable CORS correctly
- [ ] Test with real customers
- [ ] Document payment flow
- [ ] Set up monitoring/alerts
- [ ] Configure rate limiting
