<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TenantInvoice;
use App\Models\TenantSetting;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Update the subscription plan.
     */
    public function updatePlan(Request $request)
    {
        $validated = $request->validate([
            'plan' => 'required|in:basic,pro,premium,enterprise',
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $tenant->update([
            'subscription_plan' => $validated['plan']
        ]);

        // Optional: Create a mock invoice for the plan change
        // In a real app, this would be handled by Stripe webhooks

        return response()->json([
            'message' => 'Plan updated successfully',
            'plan' => $validated['plan']
        ]);
    }

    /**
     * Update payment method (Mock).
     */
    public function updatePaymentMethod(Request $request)
    {
        $validated = $request->validate([
            'card_holder' => 'required|string',
            'card_number' => 'required|string', // In real app, never send full number to backend like this
            'card_expiry' => 'required|string',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        // Extract mock details
        $lastFour = substr($validated['card_number'], -4);
        $brand = 'Visa'; // Mock detection

        // Save to settings
        $settings = [
            'card_brand' => $brand,
            'card_last_four' => $lastFour,
            'card_holder' => $validated['card_holder'],
            'card_expiry' => $validated['card_expiry']
        ];

        foreach ($settings as $key => $value) {
            TenantSetting::updateOrCreate(
                ['tenant_id' => $tenantId, 'key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Payment method updated successfully']);
    }

    /**
     * Get billing history (Invoices).
     */
    public function invoices(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        // Auto-seed some invoices if none exist (for demo purposes)
        if (TenantInvoice::where('tenant_id', $tenantId)->count() === 0) {
            $plans = ['basic' => 49, 'pro' => 99, 'premium' => 199];
            $currentPlan = $user->tenant->subscription_plan ?? 'basic';
            $amount = $plans[$currentPlan] ?? 49;

            TenantInvoice::create([
                'tenant_id' => $tenantId,
                'invoice_number' => 'INV-' . date('Y') . '-001',
                'amount' => $amount,
                'status' => 'paid',
                'invoice_date' => now()->subMonth(),
            ]);

            TenantInvoice::create([
                'tenant_id' => $tenantId,
                'invoice_number' => 'INV-' . date('Y') . '-002',
                'amount' => $amount,
                'status' => 'paid',
                'invoice_date' => now(),
            ]);
        }

        $invoices = TenantInvoice::where('tenant_id', $tenantId)
            ->orderBy('invoice_date', 'desc')
            ->get();

        return response()->json($invoices);
    }
}
