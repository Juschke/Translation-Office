<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\TenantInvoice;

class SubscriptionBillingService
{
    public function generateInvoicesForDueSubscriptions(bool $dryRun = false): array
    {
        $results = [];

        $dueSubscriptions = Subscription::query()
            ->whereIn('status', [
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_TRIAL,
            ])
            ->where('auto_renew', true)
            ->whereHas('tenant', fn ($query) => $query->where('is_active', true))
            ->cursor();

        foreach ($dueSubscriptions as $subscription) {
            $invoice = $this->generateInvoiceForSubscription($subscription, $dryRun);

            if ($invoice === null) {
                continue;
            }

            $results[] = [
                'tenant_id' => $subscription->tenant_id,
                'subscription_id' => $subscription->id,
                'invoice_id' => $invoice->id ?? null,
                'invoice_number' => $invoice->invoice_number ?? null,
                'status' => $invoice->status ?? 'dry-run',
            ];
        }

        return $results;
    }

    public function generateInvoiceForSubscription(Subscription $subscription, bool $dryRun = false): ?TenantInvoice
    {
        $periodStart = $subscription->current_period_start;
        $periodEnd = $subscription->current_period_end;

        if (! $periodStart || ! $periodEnd) {
            return null;
        }

        if ($periodEnd->greaterThan(now())) {
            return null;
        }

        if (TenantInvoice::query()
            ->where('subscription_id', $subscription->id)
            ->where('billing_period_start', $periodStart->toDateString())
            ->exists()) {
            return null;
        }

        $net = $subscription->price_net_cents / 100;
        $gross = $subscription->price_gross_cents / 100;
        $tax = round($gross - $net, 2);

        $invoiceData = [
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $this->generateInvoiceNumber($subscription),
            'status' => 'open',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'billing_period_start' => $periodStart->toDateString(),
            'billing_period_end' => $periodEnd->toDateString(),
            'amount_net' => $net,
            'tax_amount' => $tax,
            'amount' => $gross,
            'currency' => 'EUR',
            'payment_provider' => $subscription->payment_provider ?? 'invoice',
            'notes' => 'Automatisch erzeugt auf Basis des aktiven Abonnements.',
        ];

        if ($dryRun) {
            return new TenantInvoice($invoiceData);
        }

        return TenantInvoice::create($invoiceData);
    }

    protected function generateInvoiceNumber(Subscription $subscription): string
    {
        $count = TenantInvoice::whereYear('invoice_date', now()->year)->count() + 1;

        return sprintf(
            'PLT-%s-%04d',
            now()->format('Ym'),
            $count,
        );
    }
}
