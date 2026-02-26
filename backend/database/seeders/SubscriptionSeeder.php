<?php

namespace Database\Seeders;

use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    /**
     * Erstellt Beispiel-Subscriptions für alle existierenden Tenants.
     */
    public function run(): void
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->command->info('Keine Tenants gefunden. Subscription-Seeding übersprungen.');
            return;
        }

        foreach ($tenants as $index => $tenant) {
            // Skip if tenant already has a subscription
            if ($tenant->subscription()->exists()) {
                $this->command->info("Tenant {$tenant->company_name} hat bereits eine Subscription.");
                continue;
            }

            // Verschiedene Pläne für Demo-Zwecke zuweisen
            $plans = [
                [
                    'plan' => Subscription::PLAN_STARTER,
                    'price_net_cents' => 4900,  // 49 EUR
                    'price_gross_cents' => 5831, // 49 EUR + 19% MwSt
                ],
                [
                    'plan' => Subscription::PLAN_PROFESSIONAL,
                    'price_net_cents' => 9900,  // 99 EUR
                    'price_gross_cents' => 11781, // 99 EUR + 19% MwSt
                ],
                [
                    'plan' => Subscription::PLAN_ENTERPRISE,
                    'price_net_cents' => 19900, // 199 EUR
                    'price_gross_cents' => 23681, // 199 EUR + 19% MwSt
                ],
            ];

            $planData = $plans[$index % count($plans)];

            // Einige auf Trial setzen
            $isTrial = $index % 3 === 0;

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan' => $planData['plan'],
                'billing_cycle' => $index % 2 === 0 ? Subscription::CYCLE_MONTHLY : Subscription::CYCLE_YEARLY,
                'status' => $isTrial ? Subscription::STATUS_TRIAL : Subscription::STATUS_ACTIVE,

                'price_net_cents' => $planData['price_net_cents'],
                'price_gross_cents' => $planData['price_gross_cents'],
                'vat_rate_percent' => 19.00,

                // Trial
                'is_trial' => $isTrial,
                'trial_ends_at' => $isTrial ? now()->addDays(14) : null,

                // Subscription period
                'started_at' => now()->subDays(rand(1, 60)),
                'current_period_start' => now()->startOfMonth(),
                'current_period_end' => now()->endOfMonth(),
                'expires_at' => now()->addYear(),

                // Plan limits
                'max_users' => match($planData['plan']) {
                    Subscription::PLAN_STARTER => 3,
                    Subscription::PLAN_PROFESSIONAL => 10,
                    Subscription::PLAN_ENTERPRISE => null, // unlimited
                },
                'max_projects' => match($planData['plan']) {
                    Subscription::PLAN_STARTER => 50,
                    Subscription::PLAN_PROFESSIONAL => 200,
                    Subscription::PLAN_ENTERPRISE => null, // unlimited
                },
                'max_storage_gb' => match($planData['plan']) {
                    Subscription::PLAN_STARTER => 10,
                    Subscription::PLAN_PROFESSIONAL => 50,
                    Subscription::PLAN_ENTERPRISE => 200,
                },

                // Payment provider (Demo)
                'payment_provider' => Subscription::PROVIDER_SEPA,
                'billing_email' => $tenant->email,

                'auto_renew' => true,
            ]);

            $this->command->info("Subscription erstellt für Tenant: {$tenant->company_name} ({$planData['plan']})");
        }

        $this->command->info('Subscription-Seeding abgeschlossen!');
    }
}
