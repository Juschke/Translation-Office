<?php

namespace App\Console\Commands;

use App\Services\SubscriptionBillingService;
use Illuminate\Console\Command;

class GenerateSubscriptionInvoices extends Command
{
    protected $signature = 'subscriptions:generate-invoices {--dry-run} {--tenant=}';

    protected $description = 'Erzeugt Plattform-Rechnungen für bevorstehende Subscription-Zyklen.';

    public function handle(SubscriptionBillingService $billingService): int
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? 'Dry-run: Es werden keine Datensätze geschrieben.' : 'Starte Rechnungserstellung...');

        $results = $billingService->generateInvoicesForDueSubscriptions($dryRun);

        foreach ($results as $row) {
            $this->line(sprintf(
                '[Tenant %s] Subscription %s → Invoice %s (%s)',
                $row['tenant_id'],
                $row['subscription_id'],
                $row['invoice_number'] ?? 'dry-run',
                $row['status'],
            ));
        }

        $this->info('Fertig. ' . count($results) . ' Rechnungen (' . ($dryRun ? 'nur Vorschau' : 'erstellt') . ')');

        return 0;
    }
}
