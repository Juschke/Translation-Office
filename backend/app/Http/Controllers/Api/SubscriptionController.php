<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

/**
 * SubscriptionController — Tenant-facing Subscription Views
 *
 * WICHTIG: Tenants können ihre eigene Subscription nur ANSEHEN.
 * Änderungen sind nur durch Software Owner (Admin) möglich.
 */
class SubscriptionController extends Controller
{
    /**
     * Aktuelle Subscription des Tenants anzeigen.
     *
     * GET /api/subscription
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user->tenant_id) {
            return response()->json([
                'message' => 'Kein Tenant zugeordnet'
            ], 404);
        }

        $subscription = Subscription::where('tenant_id', $user->tenant_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$subscription) {
            return response()->json([
                'message' => 'Keine aktive Subscription gefunden',
                'has_subscription' => false,
            ], 404);
        }

        $this->authorize('view', $subscription);

        return response()->json([
            'subscription' => $subscription,
            'usage' => [
                'users_count' => $user->tenant->users()->count(),
                'users_limit' => $subscription->max_users,
                'users_remaining' => $subscription->max_users ? $subscription->max_users - $user->tenant->users()->count() : null,

                'projects_count' => $user->tenant->projects()->count(),
                'projects_limit' => $subscription->max_projects,
                'projects_remaining' => $subscription->max_projects ? $subscription->max_projects - $user->tenant->projects()->count() : null,
            ],
            'status_info' => [
                'is_active' => $subscription->isActive(),
                'on_trial' => $subscription->onTrial(),
                'trial_days_remaining' => $subscription->trialDaysRemaining(),
                'period_days_remaining' => $subscription->periodDaysRemaining(),
                'has_expired' => $subscription->hasExpired(),
                'can_be_cancelled' => false, // Nur Admin kann stornieren
            ]
        ]);
    }

    /**
     * Subscription History des Tenants.
     *
     * GET /api/subscription/history
     */
    public function history(Request $request)
    {
        $user = $request->user();

        if (!$user->tenant_id) {
            return response()->json([
                'message' => 'Kein Tenant zugeordnet'
            ], 404);
        }

        $subscriptions = Subscription::where('tenant_id', $user->tenant_id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Authorize view for each subscription
        foreach ($subscriptions as $subscription) {
            $this->authorize('view', $subscription);
        }

        return response()->json($subscriptions);
    }

    /**
     * Legacy-Support: Update plan (jetzt nur für Upgrade-Anfragen).
     * Tenants können Plan-Änderungen ANFRAGEN, aber nicht direkt durchführen.
     *
     * POST /api/subscription/request-upgrade
     */
    public function requestUpgrade(Request $request)
    {
        $validated = $request->validate([
            'plan' => ['required', \Illuminate\Validation\Rule::in([
                Subscription::PLAN_STARTER,
                Subscription::PLAN_PROFESSIONAL,
                Subscription::PLAN_ENTERPRISE,
            ])],
            'billing_cycle' => ['required', \Illuminate\Validation\Rule::in([
                Subscription::CYCLE_MONTHLY,
                Subscription::CYCLE_YEARLY,
            ])],
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->tenant_id) {
            return response()->json([
                'message' => 'Kein Tenant zugeordnet'
            ], 404);
        }

        // In einer echten Implementierung würde hier eine Benachrichtigung
        // an den Software Owner gesendet werden, oder ein Ticket erstellt.

        // Für jetzt nur eine Bestätigung zurückgeben
        return response()->json([
            'message' => 'Ihre Upgrade-Anfrage wurde übermittelt. Unser Team wird sich in Kürze bei Ihnen melden.',
            'requested_plan' => $validated['plan'],
            'requested_cycle' => $validated['billing_cycle'],
        ]);
    }

    /**
     * Legacy-Support: Update payment method (Read-Only Info).
     *
     * GET /api/subscription/payment-method
     */
    public function paymentMethod(Request $request)
    {
        $user = $request->user();

        if (!$user->tenant_id) {
            return response()->json([
                'message' => 'Kein Tenant zugeordnet'
            ], 404);
        }

        $subscription = Subscription::where('tenant_id', $user->tenant_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$subscription) {
            return response()->json([
                'message' => 'Keine aktive Subscription gefunden'
            ], 404);
        }

        $this->authorize('view', $subscription);

        return response()->json([
            'payment_provider' => $subscription->payment_provider,
            'billing_email' => $subscription->billing_email,
            'message' => 'Zahlungsmethoden können nur durch den Software-Administrator geändert werden.',
        ]);
    }

    /**
     * Legacy-Support: Invoices (Placeholder).
     *
     * GET /api/subscription/invoices
     */
    public function invoices(Request $request)
    {
        // Placeholder: In Zukunft könnten hier echte Abrechnungen
        // aus dem Payment Provider (Stripe/PayPal) abgerufen werden.

        return response()->json([
            'message' => 'Rechnungshistorie wird in Kürze verfügbar sein.',
            'invoices' => []
        ]);
    }
}
