<?php

namespace App\Http\Controllers\Api;

use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Event;
use Stripe\Stripe;
use Stripe\WebhookEndpoint;

class WebhookController
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * Verarbeite Stripe Webhooks
     * Route: POST /api/webhooks/stripe (öffentlich, kein Auth erforderlich)
     */
    public function stripe(Request $request): JsonResponse
    {
        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $payload = $request->getContent();
            $sigHeader = $request->header('Stripe-Signature');
            $endpointSecret = config('services.stripe.webhook_secret');

            // Validiere Webhook-Signatur
            $event = Event::constructFrom(
                json_decode($payload, true)
            );

            // Verifiziere Signatur nur in Produktion
            if (config('app.env') === 'production') {
                try {
                    $event = \Stripe\Webhook::constructEvent(
                        $payload,
                        $sigHeader,
                        $endpointSecret
                    );
                } catch (\UnexpectedValueException $e) {
                    Log::error('Invalid Stripe webhook payload');
                    return response()->json(['error' => 'Invalid payload'], 400);
                } catch (\Stripe\Exception\SignatureVerificationException $e) {
                    Log::error('Invalid Stripe webhook signature');
                    return response()->json(['error' => 'Invalid signature'], 400);
                }
            }

            // Verarbeite Events
            match ($event->type) {
                'payment_intent.succeeded' => $this->handlePaymentSucceeded($event),
                'payment_intent.payment_failed' => $this->handlePaymentFailed($event),
                'charge.refunded' => $this->handleChargeRefunded($event),
                default => Log::info('Unhandled Stripe event', ['type' => $event->type]),
            };

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Webhook für generische Events (custom events)
     */
    public function custom(Request $request): JsonResponse
    {
        $request->validate([
            'event' => 'required|string',
            'resource_type' => 'required|string',
            'resource_id' => 'required|integer',
            'data' => 'nullable|array',
        ]);

        try {
            Log::info('Custom webhook received', [
                'event' => $request->event,
                'resource_type' => $request->resource_type,
                'resource_id' => $request->resource_id,
            ]);

            // Verifiziere Webhook-Authentifizierung (Token-basiert)
            $webhookToken = $request->header('X-Webhook-Token');
            if (!$this->verifyWebhookToken($request, $webhookToken)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Verarbeite basierend auf Event-Typ
            match ($request->event) {
                'invoice.created' => event(new \App\Events\InvoiceCreated($request->all())),
                'project.updated' => event(new \App\Events\ProjectUpdated($request->all())),
                'payment.received' => event(new \App\Events\PaymentReceived($request->all())),
                default => Log::info('Unhandled custom event'),
            };

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Private Hilfsmethoden

    private function handlePaymentSucceeded(\stdClass $event): void
    {
        $intentId = $event->data->object->id;
        $metadata = $event->data->object->metadata;

        $invoice = Invoice::find($metadata->invoice_id ?? null);
        if (!$invoice) {
            Log::error('Invoice not found for payment intent', ['intent_id' => $intentId]);
            return;
        }

        try {
            $payment = $this->paymentService->processPayment($intentId, $invoice);
            event(new PaymentSucceeded($payment));
        } catch (\Exception $e) {
            Log::error('Failed to process payment from webhook', [
                'intent_id' => $intentId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function handlePaymentFailed(\stdClass $event): void
    {
        $intentId = $event->data->object->id;
        $metadata = $event->data->object->metadata;
        $lastError = $event->data->object->last_payment_error;

        $invoice = Invoice::find($metadata->invoice_id ?? null);
        if (!$invoice) {
            return;
        }

        // Erstelle fehlgeschlagene Payment-Datensatz
        Payment::create([
            'invoice_id' => $invoice->id,
            'tenant_id' => $invoice->tenant_id,
            'amount' => $event->data->object->amount / 100,
            'currency' => strtoupper($event->data->object->currency),
            'payment_method' => 'stripe',
            'stripe_intent_id' => $intentId,
            'status' => 'failed',
            'metadata' => [
                'error_code' => $lastError->code ?? null,
                'error_message' => $lastError->message ?? null,
            ],
        ]);

        event(new PaymentFailed($invoice, $lastError->message ?? 'Unknown error'));
    }

    private function handleChargeRefunded(\stdClass $event): void
    {
        $chargeId = $event->data->object->id;
        $amount = $event->data->object->amount_refunded / 100;

        $payment = Payment::where('stripe_charge_id', $chargeId)->first();
        if (!$payment) {
            return;
        }

        $payment->update([
            'status' => 'refunded',
            'refunded_amount' => $amount,
            'refunded_at' => now(),
        ]);
    }

    private function verifyWebhookToken(Request $request, ?string $token): bool
    {
        if (!$token) {
            return false;
        }

        // Implementiere Token-Verifizierung basierend auf deinem System
        $webhook = \App\Models\Webhook::where('token', $token)
            ->where('tenant_id', $request->tenant_id ?? auth()->user()->tenant_id)
            ->first();

        return $webhook && $webhook->is_active;
    }
}
