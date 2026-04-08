<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InvoiceAuditLog;
use App\Models\Invoice;

class VerifyInvoiceAuditChain extends Command
{
    protected $signature = 'invoices:verify-audit-chain
                            {--invoice-id= : Nur eine bestimmte Rechnung prüfen}
                            {--fix : Defekte Einträge in der Ausgabe markieren (nur Ausgabe, nie reparieren)}';

    protected $description = 'Verifiziert die kryptografische Hash-Kette aller Invoice Audit Logs (GoBD-Anforderung)';

    public function handle(): int
    {
        $invoiceId = $this->option('invoice-id');

        $query = Invoice::query();
        if ($invoiceId) {
            $query->where('id', $invoiceId);
        }

        $totalInvoices = 0;
        $brokenChains  = 0;
        $brokenEntries = [];

        $query->chunk(100, function ($invoices) use (&$totalInvoices, &$brokenChains, &$brokenEntries) {
            foreach ($invoices as $invoice) {
                $totalInvoices++;
                $logs = InvoiceAuditLog::where('invoice_id', $invoice->id)
                    ->orderBy('id')
                    ->get();

                $previousHash = null;
                foreach ($logs as $log) {
                    // Rekonstruiere den Payload exakt wie beim Erstellen in logAuditEvent()
                    $payload = [
                        'invoice_id'    => $log->invoice_id,
                        'user_id'       => $log->user_id,
                        'action'        => $log->action,
                        'old_status'    => $log->old_status,
                        'new_status'    => $log->new_status,
                        'previous_hash' => $log->previous_hash,
                        'metadata'      => $log->metadata,
                        'ip_address'    => $log->ip_address,
                        'created_at'    => $log->created_at->toIso8601String(),
                    ];
                    $expectedHash = hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

                    $hashOk  = $log->record_hash === $expectedHash;
                    $chainOk = $log->previous_hash === $previousHash;

                    if (!$hashOk || !$chainOk) {
                        $brokenChains++;
                        $brokenEntries[] = [
                            'invoice_number' => $invoice->invoice_number,
                            'log_id'         => $log->id,
                            'action'         => $log->action,
                            'created_at'     => $log->created_at->toDateTimeString(),
                            'problem'        => !$hashOk ? 'HASH_MISMATCH' : 'CHAIN_BROKEN',
                        ];
                    }

                    $previousHash = $log->record_hash;
                }
            }
        });

        if ($brokenChains === 0) {
            $this->info("Alle {$totalInvoices} Rechnungen — Hash-Kette intakt. GoBD-konform.");
            return Command::SUCCESS;
        }

        $this->error("{$brokenChains} defekte Eintraege in {$totalInvoices} Rechnungen gefunden!");
        $this->table(
            ['Rechnungsnummer', 'Log-ID', 'Aktion', 'Erstellt am', 'Problem'],
            $brokenEntries
        );

        // In Log-Datei für Audit-Trail schreiben
        \Illuminate\Support\Facades\Log::critical('GoBD Audit Chain Verification FAILED', [
            'broken_count' => $brokenChains,
            'entries'      => $brokenEntries,
        ]);

        return Command::FAILURE;
    }
}
