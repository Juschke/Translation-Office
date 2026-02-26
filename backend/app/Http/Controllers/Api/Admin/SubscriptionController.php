<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * SubscriptionController — Admin-only Subscription Management
 *
 * WICHTIG: Alle Endpoints sind NUR für Software Owner (is_admin = true).
 * Zugriffskontrolle erfolgt über SubscriptionPolicy.
 */
class SubscriptionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Subscription::class, 'subscription');
    }

    /**
     * Liste aller Subscriptions mit Tenant-Informationen.
     *
     * GET /api/admin/subscriptions
     */
    public function index(Request $request)
    {
        $query = Subscription::with('tenant');

        // Filter nach Status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter nach Plan
        if ($request->has('plan')) {
            $query->where('plan', $request->plan);
        }

        // Filter nach ablaufenden Subscriptions
        if ($request->boolean('expiring_soon')) {
            $query->where('expires_at', '<=', now()->addDays(30))
                  ->where('expires_at', '>', now());
        }

        // Sortierung
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $subscriptions = $query->paginate($request->get('per_page', 15));

        return response()->json($subscriptions);
    }

    /**
     * Neue Subscription für einen Tenant erstellen.
     *
     * POST /api/admin/subscriptions
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required|exists:tenants,id',
            'plan' => ['required', Rule::in([
                Subscription::PLAN_FREE,
                Subscription::PLAN_STARTER,
                Subscription::PLAN_PROFESSIONAL,
                Subscription::PLAN_ENTERPRISE,
            ])],
            'billing_cycle' => ['required', Rule::in([
                Subscription::CYCLE_MONTHLY,
                Subscription::CYCLE_YEARLY,
            ])],
            'status' => ['nullable', Rule::in([
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_TRIAL,
                Subscription::STATUS_CANCELLED,
                Subscription::STATUS_EXPIRED,
                Subscription::STATUS_PAST_DUE,
            ])],
            'price_net_cents' => 'required|integer|min:0',
            'price_gross_cents' => 'required|integer|min:0',
            'vat_rate_percent' => 'required|numeric|min:0|max:100',

            // Trial
            'is_trial' => 'boolean',
            'trial_ends_at' => 'nullable|date',

            // Subscription period
            'started_at' => 'nullable|date',
            'current_period_start' => 'nullable|date',
            'current_period_end' => 'nullable|date',
            'expires_at' => 'nullable|date',

            // Plan limits
            'max_users' => 'nullable|integer|min:1',
            'max_projects' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',

            // Payment provider
            'payment_provider' => ['nullable', Rule::in([
                Subscription::PROVIDER_STRIPE,
                Subscription::PROVIDER_PAYPAL,
                Subscription::PROVIDER_SEPA,
                Subscription::PROVIDER_INVOICE,
            ])],
            'payment_provider_subscription_id' => 'nullable|string',
            'payment_provider_customer_id' => 'nullable|string',

            // Billing
            'billing_email' => 'nullable|email',
            'billing_address' => 'nullable|string',

            'auto_renew' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription = Subscription::create($validator->validated());

        return response()->json($subscription->load('tenant'), 201);
    }

    /**
     * Subscription-Details anzeigen.
     *
     * GET /api/admin/subscriptions/{id}
     */
    public function show(Subscription $subscription)
    {
        return response()->json($subscription->load('tenant'));
    }

    /**
     * Subscription aktualisieren.
     *
     * PUT/PATCH /api/admin/subscriptions/{id}
     */
    public function update(Request $request, Subscription $subscription)
    {
        $validator = Validator::make($request->all(), [
            'plan' => ['sometimes', Rule::in([
                Subscription::PLAN_FREE,
                Subscription::PLAN_STARTER,
                Subscription::PLAN_PROFESSIONAL,
                Subscription::PLAN_ENTERPRISE,
            ])],
            'billing_cycle' => ['sometimes', Rule::in([
                Subscription::CYCLE_MONTHLY,
                Subscription::CYCLE_YEARLY,
            ])],
            'status' => ['sometimes', Rule::in([
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_TRIAL,
                Subscription::STATUS_CANCELLED,
                Subscription::STATUS_EXPIRED,
                Subscription::STATUS_PAST_DUE,
            ])],
            'price_net_cents' => 'sometimes|integer|min:0',
            'price_gross_cents' => 'sometimes|integer|min:0',
            'vat_rate_percent' => 'sometimes|numeric|min:0|max:100',

            'is_trial' => 'sometimes|boolean',
            'trial_ends_at' => 'nullable|date',

            'started_at' => 'nullable|date',
            'current_period_start' => 'nullable|date',
            'current_period_end' => 'nullable|date',
            'cancelled_at' => 'nullable|date',
            'expires_at' => 'nullable|date',

            'max_users' => 'nullable|integer|min:1',
            'max_projects' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',

            'payment_provider' => ['nullable', Rule::in([
                Subscription::PROVIDER_STRIPE,
                Subscription::PROVIDER_PAYPAL,
                Subscription::PROVIDER_SEPA,
                Subscription::PROVIDER_INVOICE,
            ])],
            'payment_provider_subscription_id' => 'nullable|string',
            'payment_provider_customer_id' => 'nullable|string',

            'billing_email' => 'nullable|email',
            'billing_address' => 'nullable|string',

            'auto_renew' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription->update($validator->validated());

        return response()->json($subscription->fresh()->load('tenant'));
    }

    /**
     * Subscription löschen (soft delete).
     *
     * DELETE /api/admin/subscriptions/{id}
     */
    public function destroy(Subscription $subscription)
    {
        $subscription->delete();

        return response()->json(['message' => 'Subscription erfolgreich gelöscht'], 200);
    }

    /**
     * Subscription stornieren (für non-renewal markieren).
     *
     * POST /api/admin/subscriptions/{id}/cancel
     */
    public function cancel(Subscription $subscription)
    {
        $this->authorize('update', $subscription);

        if (!$subscription->canBeCancelled()) {
            return response()->json([
                'message' => 'Diese Subscription kann nicht storniert werden'
            ], 400);
        }

        $subscription->cancel();

        return response()->json([
            'message' => 'Subscription erfolgreich storniert',
            'subscription' => $subscription->fresh()->load('tenant')
        ]);
    }

    /**
     * Stornierte Subscription reaktivieren.
     *
     * POST /api/admin/subscriptions/{id}/resume
     */
    public function resume(Subscription $subscription)
    {
        $this->authorize('update', $subscription);

        if ($subscription->hasExpired()) {
            return response()->json([
                'message' => 'Diese Subscription ist bereits abgelaufen'
            ], 400);
        }

        $subscription->resume();

        return response()->json([
            'message' => 'Subscription erfolgreich reaktiviert',
            'subscription' => $subscription->fresh()->load('tenant')
        ]);
    }

    /**
     * Subscription-Statistiken für Dashboard.
     *
     * GET /api/admin/subscriptions/stats
     */
    public function stats()
    {
        $this->authorize('viewAny', Subscription::class);

        $stats = [
            'total' => Subscription::count(),
            'active' => Subscription::where('status', Subscription::STATUS_ACTIVE)->count(),
            'trial' => Subscription::where('status', Subscription::STATUS_TRIAL)->count(),
            'cancelled' => Subscription::where('status', Subscription::STATUS_CANCELLED)->count(),
            'expired' => Subscription::where('status', Subscription::STATUS_EXPIRED)->count(),
            'past_due' => Subscription::where('status', Subscription::STATUS_PAST_DUE)->count(),

            // Revenue berechnung (nur aktive + trial)
            'monthly_revenue_cents' => Subscription::whereIn('status', [
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_TRIAL
            ])
            ->where('billing_cycle', Subscription::CYCLE_MONTHLY)
            ->sum('price_gross_cents'),

            'yearly_revenue_cents' => Subscription::whereIn('status', [
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_TRIAL
            ])
            ->where('billing_cycle', Subscription::CYCLE_YEARLY)
            ->sum('price_gross_cents'),

            // Plan distribution
            'by_plan' => [
                'free' => Subscription::where('plan', Subscription::PLAN_FREE)->count(),
                'starter' => Subscription::where('plan', Subscription::PLAN_STARTER)->count(),
                'professional' => Subscription::where('plan', Subscription::PLAN_PROFESSIONAL)->count(),
                'enterprise' => Subscription::where('plan', Subscription::PLAN_ENTERPRISE)->count(),
            ],

            // Expiring soon (next 30 days)
            'expiring_soon' => Subscription::where('expires_at', '<=', now()->addDays(30))
                ->where('expires_at', '>', now())
                ->count(),
        ];

        return response()->json($stats);
    }
}
