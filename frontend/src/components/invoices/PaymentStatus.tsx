import { useQuery } from '@tanstack/react-query';
import { getPaymentsList } from '@/api/services/payments';
import { useState } from 'react';
import { PaymentStripeModal } from '@/components/modals/PaymentStripeModal';
import type { Payment } from '@/api/services/payments';

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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Payment Status</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Total Amount:</span>
          <span className="font-medium text-gray-900">
            {(amount / 100).toFixed(2)} {currency}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Outstanding:</span>
          <span
            className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {(outstanding / 100).toFixed(2)} {currency}
          </span>
        </div>

        {paymentData?.payments && paymentData.payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-3">Payment History:</p>
            <div className="space-y-2">
              {paymentData.payments.map((payment: Payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between text-xs bg-gray-50 p-2 rounded"
                >
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {new Date(payment.paid_at || '').toLocaleDateString()}
                    </p>
                    <p className="text-gray-500">
                      {payment.payment_method === 'stripe'
                        ? 'Stripe Card'
                        : payment.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {(payment.amount / 100).toFixed(2)} {payment.currency}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isPaid && (
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
        >
          💳 Pay Invoice
        </button>
      )}

      {isPaid && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm text-center font-medium">
          ✓ Invoice fully paid
        </div>
      )}

      <PaymentStripeModal
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
