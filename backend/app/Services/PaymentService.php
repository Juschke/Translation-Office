<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Stripe\Charge;
use Stripe\PaymentIntent;
use Stripe\Stripe;

/**
 * Service für Payment Gateway Integration (Stripe)
 * Verwaltet Zahlungen, Refunds und Payment Intents
 */
class PaymentService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Erstelle Payment Intent für eine Rechnung
     */
    public function createPaymentIntent(Invoice $invoice, ?string $customerId = null): PaymentIntent
    {
        try {
            $intent = PaymentIntent::create([
                'amount' => (int)($invoice->amount_gross * 100), // Centimes
                'currency' => strtolower($invoice->currency ?? 'eur'),
                'description' => "Invoice {$invoice->invoice_number}",
                'metadata' => [
                    'invoice_id' => $invoice->id,
                    'tenant_id' => $invoice->tenant_id,
                    'customer_id' => $invoice->customer_id,
                ],
                'customer' => $customerId,
            ]);

            // Speichere Intent ID
            $invoice->update(['stripe_intent_id' => $intent->id]);

            Log::info('Payment intent created', [
                'invoice_id' => $invoice->id,
                'intent_id' => $intent->id,
                'amount' => $invoice->amount_gross,
            ]);

            return $intent;
        } catch (\Exception $e) {
            Log::error('Failed to create payment intent', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Verarbeite erfolgreiche Zahlung
     */
    public function processPayment(string $intentId, Invoice $invoice): Payment
    {
        try {
            $intent = PaymentIntent::retrieve($intentId);

            if ($intent->status !== 'succeeded') {
                throw new \Exception("Payment intent status is {$intent->status}");
            }

            // Erstelle Payment-Datensatz
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'tenant_id' => $invoice->tenant_id,
                'amount' => $invoice->amount_gross,
                'currency' => $invoice->currency ?? 'EUR',
                'payment_method' => 'stripe',
                'stripe_intent_id' => $intentId,
                'stripe_charge_id' => $intent->charges->data[0]->id ?? null,
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            // Aktualisiere Rechnungsstatus
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            Log::info('Payment processed successfully', [
                'invoice_id' => $invoice->id,
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
            ]);

            return $payment;
        } catch (\Exception $e) {
            Log::error('Failed to process payment', [
                'intent_id' => $intentId,
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Erstatte eine Zahlung
     */
    public function refund(Payment $payment, ?float $amount = null): Payment
    {
        try {
            $refundAmount = $amount ? (int)($amount * 100) : null;

            $refund = Charge::retrieve($payment->stripe_charge_id)
                ->refund(['amount' => $refundAmount]);

            // Aktualisiere Payment-Status
            $payment->update([
                'status' => 'refunded',
                'refunded_amount' => $amount ?? $payment->amount,
                'refunded_at' => now(),
            ]);

            // Aktualisiere Invoice
            if (!$amount || $amount === $payment->amount) {
                $payment->invoice->update(['status' => 'cancelled']);
            }

            Log::info('Payment refunded', [
                'payment_id' => $payment->id,
                'refund_id' => $refund->id,
                'amount' => $amount ?? $payment->amount,
            ]);

            return $payment;
        } catch (\Exception $e) {
            Log::error('Refund failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Hole Stripe-Kunde oder erstelle ihn
     */
    public function getOrCreateStripeCustomer($customer): string
    {
        if ($customer->stripe_customer_id) {
            return $customer->stripe_customer_id;
        }

        try {
            $stripeCustomer = \Stripe\Customer::create([
                'email' => $customer->email,
                'name' => $customer->company_name ?? "{$customer->first_name} {$customer->last_name}",
                'metadata' => [
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                ],
            ]);

            $customer->update(['stripe_customer_id' => $stripeCustomer->id]);

            return $stripeCustomer->id;
        } catch (\Exception $e) {
            Log::error('Failed to create Stripe customer', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Liste Zahlungen für Rechnung auf
     */
    public function getPayments(Invoice $invoice)
    {
        return Payment::where('invoice_id', $invoice->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Berechne verbleibenden Betrag
     */
    public function getOutstandingAmount(Invoice $invoice): float
    {
        $paid = Payment::where('invoice_id', $invoice->id)
            ->where('status', 'completed')
            ->sum('amount');

        return max(0, $invoice->amount_gross - $paid);
    }
}
