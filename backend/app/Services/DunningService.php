<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\DunningLog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Service für Mahnwesen (Dunning Management)
 * Verwaltet automatisierte Zahlungserinnerungen mit konfigurierbaren Eskalationsstufen
 */
class DunningService
{
    /**
     * Sende Mahnung für überfällige Rechnung
     */
    public function sendReminder(Invoice $invoice, int $reminderLevel = 1): DunningLog
    {
        // Validiere dass Rechnung tatsächlich überfällig ist
        if ($invoice->status === 'paid' || !$invoice->due_date->isPast()) {
            throw new \Exception('Invoice is not overdue');
        }

        // Erstelle DunningLog-Eintrag
        $dunningLog = DunningLog::create([
            'invoice_id' => $invoice->id,
            'tenant_id' => $invoice->tenant_id,
            'reminder_level' => $reminderLevel,
            'outstanding_amount' => $this->getOutstandingAmount($invoice),
            'sent_at' => now(),
            'status' => 'sent',
        ]);

        // Aktualisiere Invoice Reminder-Tracking
        $invoice->update([
            'reminder_level' => max($invoice->reminder_level ?? 0, $reminderLevel),
            'last_reminder_date' => now(),
        ]);

        // Sende Email (async)
        $this->sendDunningEmail($invoice, $reminderLevel, $dunningLog);

        // Trigger Webhook
        event(new \App\Events\DunningReminderSent($invoice, $reminderLevel));

        Log::info('Dunning reminder sent', [
            'invoice_id' => $invoice->id,
            'reminder_level' => $reminderLevel,
            'outstanding' => $dunningLog->outstanding_amount,
        ]);

        return $dunningLog;
    }

    /**
     * Sende Mahnung asynchron
     */
    private function sendDunningEmail(Invoice $invoice, int $level, DunningLog $log): void
    {
        $settings = $this->getDunningSettings($invoice->tenant_id);
        $template = $settings['templates'][$level - 1] ?? null;

        if (!$template) {
            return;
        }

        \App\Jobs\SendDunningEmail::dispatch($invoice, $level, $template, $log);
    }

    /**
     * Automatische Dunning-Prüfung für alle überfälligen Rechnungen
     * Sollte als Scheduled Command ausgeführt werden
     */
    public function processDunningQueue(): int
    {
        $daysOverdue = config('dunning.days_overdue', [3, 10, 20]);
        $processedCount = 0;

        foreach ($daysOverdue as $index => $days) {
            $reminderLevel = $index + 1;

            // Finde Rechnungen die diese Stufe erreicht haben
            $invoices = Invoice::query()
                ->where('status', '!=', 'paid')
                ->where('status', '!=', 'cancelled')
                ->whereNotNull('due_date')
                ->where('due_date', '<=', now()->subDays($days))
                ->where(function ($q) use ($reminderLevel) {
                    // Hat Mahnung auf dieser Stufe noch nicht erhalten
                    $q->whereNull('reminder_level')
                        ->orWhere('reminder_level', '<', $reminderLevel);
                })
                ->get();

            foreach ($invoices as $invoice) {
                try {
                    // Prüfe ob bereits auf dieser Stufe gemahnt wurde
                    $existingLog = DunningLog::where('invoice_id', $invoice->id)
                        ->where('reminder_level', $reminderLevel)
                        ->latest()
                        ->first();

                    // Sende nur wenn min. X Tage vergangen seit letzter Mahnung
                    if ($existingLog && $existingLog->sent_at->diffInDays(now()) < 7) {
                        continue;
                    }

                    $this->sendReminder($invoice, $reminderLevel);
                    $processedCount++;
                } catch (\Exception $e) {
                    Log::error('Dunning process failed', [
                        'invoice_id' => $invoice->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        Log::info("Dunning queue processed: $processedCount reminders sent");
        return $processedCount;
    }

    /**
     * Hole Dunning-Einstellungen für Tenant
     */
    public function getDunningSettings(int $tenantId): array
    {
        return \Illuminate\Support\Facades\Cache::rememberForever(
            "dunning:settings:$tenantId",
            fn () => \App\Models\DunningSettings::where('tenant_id', $tenantId)
                ->first()
                ?->toArray() ?? $this->getDefaultSettings()
        );
    }

    /**
     * Aktualisiere Dunning-Einstellungen
     */
    public function updateSettings(int $tenantId, array $data): void
    {
        \App\Models\DunningSettings::updateOrCreate(
            ['tenant_id' => $tenantId],
            $data
        );

        // Invalidiere Cache
        \Illuminate\Support\Facades\Cache::forget("dunning:settings:$tenantId");
    }

    /**
     * Hole verbleibenden Betrag für Rechnung
     */
    public function getOutstandingAmount(Invoice $invoice): float
    {
        $paid = \App\Models\Payment::where('invoice_id', $invoice->id)
            ->where('status', 'completed')
            ->sum('amount');

        return max(0, $invoice->amount_gross - $paid);
    }

    /**
     * Generiere Dunning-PDF
     */
    public function generateDunningPdf(Invoice $invoice, DunningLog $log): string
    {
        $settings = $this->getDunningSettings($invoice->tenant_id);
        $reminderLevel = $log->reminder_level;

        $html = view('dunning.reminder-pdf', [
            'invoice' => $invoice,
            'dunningLog' => $log,
            'reminderLevel' => $reminderLevel,
            'outstandingAmount' => $log->outstanding_amount,
            'settings' => $settings,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
            ->setBasePath(public_path())
            ->setOption('isPhpEnabled', true);

        $filename = "dunning_{$invoice->invoice_number}_level{$reminderLevel}_" . now()->format('YmdHis') . '.pdf';
        $path = "dunning/" . $invoice->tenant_id . "/" . $filename;

        \Illuminate\Support\Facades\Storage::put($path, $pdf->output());

        // Update DunningLog
        $log->update([
            'pdf_path' => $path,
            'pdf_hash' => hash_file('sha256', storage_path("app/$path")),
        ]);

        return $path;
    }

    /**
     * Hole Standard-Einstellungen
     */
    private function getDefaultSettings(): array
    {
        return [
            'enabled' => true,
            'days_overdue' => [3, 10, 20],
            'templates' => [
                1 => 'Erste Mahnung: Freundliche Erinnerung',
                2 => 'Zweite Mahnung: Zahlungsaufforderung',
                3 => 'Dritte Mahnung: Letzte Aufforderung vor Rechtsmittel',
            ],
            'include_fees' => false,
            'fee_per_level' => 5.00,
            'max_reminders' => 3,
            'stop_on_payment_plan' => true,
        ];
    }
}
