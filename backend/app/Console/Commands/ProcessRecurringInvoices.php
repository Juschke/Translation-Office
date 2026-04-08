<?php

namespace App\Console\Commands;

use App\Models\RecurringInvoice;
use Illuminate\Console\Command;

class ProcessRecurringInvoices extends Command
{
    protected $signature   = 'invoices:process-recurring';
    protected $description = 'Erstellt fällige wiederkehrende Rechnungen automatisch';

    public function handle(): int
    {
        $due = RecurringInvoice::dueForExecution()->get();

        if ($due->isEmpty()) {
            $this->info('Keine fälligen Daueraufträge.');
            return Command::SUCCESS;
        }

        $created = 0;
        $failed  = 0;

        foreach ($due as $recurring) {
            try {
                $invoice = $recurring->createInvoice();
                $this->line("  ✓ Rechnung erstellt für: {$recurring->name} (ID: {$invoice->id})");
                $created++;
            } catch (\Exception $e) {
                \Log::error('ProcessRecurringInvoices failed', [
                    'recurring_id' => $recurring->id,
                    'error'        => $e->getMessage(),
                ]);
                $this->error("  ✗ Fehler bei: {$recurring->name} — {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Fertig: {$created} erstellt, {$failed} fehlgeschlagen.");
        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
