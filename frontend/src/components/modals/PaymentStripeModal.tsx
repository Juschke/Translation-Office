import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  confirmPayment,
  createPaymentIntent,
  type PaymentIntent,
} from '@/api/services/payments';
import Modal from './Modal';
import toast from 'react-hot-toast';

interface PaymentStripeModalProps {
  isOpen: boolean;
  invoiceId: number;
  amount: number;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function PaymentContent({
  invoiceId,
  amount,
  currency,
  onClose,
  onSuccess,
}: Omit<PaymentStripeModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const { data: intent, isLoading: intentLoading, error: intentError } = useQuery({
    queryKey: ['paymentIntent', invoiceId],
    queryFn: () => createPaymentIntent(invoiceId),
  });

  useEffect(() => {
    if (intentError) {
      toast.error('Failed to initialize payment');
    }
  }, [intentError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    if (!stripe || !elements || !intent) {
      toast.error('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    setIsLoading(true);

    try {
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setCardError(result.error.message || 'Payment failed');
        toast.error(result.error.message || 'Payment failed');
        return;
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setCardError('Payment was not completed');
        toast.error('Payment was not completed');
        return;
      }

      // Confirm payment on backend
      await confirmPayment(invoiceId, intent.intent_id);

      toast.success('Payment completed successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setCardError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (intentLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (intentError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to initialize payment. Please try again.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: '"system-ui", "-apple-system", "Segoe UI"',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
              },
            }}
          />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600">{cardError}</p>
        )}
      </div>

      {/* Amount Summary */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Amount to Pay:</span>
          <span className="text-2xl font-bold text-gray-900">
            {amount.toFixed(2)} {currency}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This payment will be processed securely through Stripe
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading || !intent}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Processing...
            </span>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>

      {/* Test Card Info */}
      <p className="text-xs text-gray-500 text-center pt-2">
        Test card: 4242 4242 4242 4242 | Any future date | Any CVC
      </p>
    </form>
  );
}

function StripeProvider({ children }: { children: React.ReactNode }) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    import('@stripe/js').then((stripe) => {
      setStripePromise(
        stripe.loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '')
      );
    });
  }, []);

  if (!stripePromise) {
    return <div className="text-center py-8">Loading Stripe...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}

export function PaymentStripeModal({
  isOpen,
  invoiceId,
  amount,
  currency,
  onClose,
  onSuccess,
}: PaymentStripeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay Invoice"
    >
      <div className="w-full">
        <StripeProvider>
          <PaymentContent
            invoiceId={invoiceId}
            amount={amount}
            currency={currency}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </StripeProvider>
      </div>
    </Modal>
  );
}
