<?php

namespace App\Http\Controllers\Api;

use App\Models\Invoice;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * Erstelle Payment Intent für Rechnung
     */
    public function createIntent(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);
        $this->authorize('view', $invoice);

        $customerId = $this->paymentService->getOrCreateStripeCustomer($invoice->customer);
        $intent = $this->paymentService->createPaymentIntent($invoice, $customerId);

        return response()->json([
            'client_secret' => $intent->client_secret,
            'intent_id' => $intent->id,
            'amount' => $invoice->amount_gross,
            'currency' => $invoice->currency ?? 'EUR',
        ]);
    }

    /**
     * Bestätige Zahlung nach Stripe-Verarbeitung
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'intent_id' => 'required|string',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);
        $this->authorize('view', $invoice);

        try {
            $payment = $this->paymentService->processPayment($request->intent_id, $invoice);

            return response()->json([
                'success' => true,
                'payment_id' => $payment->id,
                'message' => 'Zahlung erfolgreich verarbeitet',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Liste Zahlungen für Rechnung
     */
    public function list(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        $payments = $this->paymentService->getPayments($invoice);
        $outstanding = $this->paymentService->getOutstandingAmount($invoice);

        return response()->json([
            'payments' => $payments,
            'outstanding' => $outstanding,
            'total_paid' => $invoice->amount_gross - $outstanding,
        ]);
    }

    /**
     * Zahlung erstatten
     */
    public function refund(Request $request): JsonResponse
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'amount' => 'nullable|numeric|min:0',
        ]);

        $payment = \App\Models\Payment::findOrFail($request->payment_id);
        $this->authorize('view', $payment->invoice);

        try {
            $payment = $this->paymentService->refund($payment, $request->amount);

            return response()->json([
                'success' => true,
                'payment' => $payment,
                'message' => 'Zahlung erstattet',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
