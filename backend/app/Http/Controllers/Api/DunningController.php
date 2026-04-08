<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DunningLog;
use App\Models\DunningSetting;
use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DunningController extends Controller
{
    // ── Mahnliste ────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Invoice::with(['customer:id,company_name,first_name,last_name', 'dunningLogs'])
            ->whereIn('status', ['issued', 'overdue'])
            ->where('due_date', '<', today());

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('reminder_level')) {
            $query->where('reminder_level', $request->reminder_level);
        }

        $invoices = $query->orderBy('due_date')->get();

        $items = $invoices->map(function (Invoice $inv) {
            $daysOverdue = (int) Carbon::parse($inv->due_date)->diffInDays(today(), false);
            $customerName = $inv->snapshot_customer_name
                ?? $inv->customer?->company_name
                ?? trim(($inv->customer?->first_name ?? '') . ' ' . ($inv->customer?->last_name ?? ''));

            return [
                'id'                 => $inv->id,
                'invoice_id'         => $inv->id,
                'invoice_number'     => $inv->invoice_number,
                'customer_id'        => $inv->customer_id,
                'customer_name'      => $customerName,
                'amount_gross_cents' => $inv->amount_gross,
                'amount_gross_eur'   => $inv->amount_gross / 100,
                'paid_amount_eur'    => $inv->paid_amount_eur ?? 0,
                'amount_due_eur'     => ($inv->amount_gross / 100) - ($inv->paid_amount_eur ?? 0),
                'due_date'           => $inv->due_date?->toDateString(),
                'days_overdue'       => max(0, $daysOverdue),
                'reminder_level'     => $inv->reminder_level ?? 0,
                'last_reminder_date' => $inv->last_reminder_date?->toDateString(),
                'status'             => $inv->status,
                'dunning_logs'       => $inv->dunningLogs->map(fn($log) => [
                    'id'          => $log->id,
                    'level'       => $log->level,
                    'level_label' => $log->level_label,
                    'fee_cents'   => $log->fee_cents,
                    'fee_eur'     => $log->fee_cents / 100,
                    'sent_at'     => $log->sent_at?->toIso8601String(),
                    'pdf_path'    => $log->pdf_path,
                ]),
            ];
        });

        // Zusammenfassung nach Stufen
        $summary = [
            'total_count'      => $items->count(),
            'total_amount_eur' => round($items->sum('amount_due_eur'), 2),
            'level0_count'     => $items->where('reminder_level', 0)->count(),
            'level1_count'     => $items->where('reminder_level', 1)->count(),
            'level2_count'     => $items->where('reminder_level', 2)->count(),
            'level3_count'     => $items->where('reminder_level', 3)->count(),
        ];

        return response()->json(['data' => $items, 'summary' => $summary]);
    }

    // ── Mahnung absenden ─────────────────────────────────────────────────────

    public function sendReminder(Request $request, Invoice $invoice)
    {
        if (!in_array($invoice->status, ['issued', 'overdue'])) {
            return response()->json(['message' => 'Mahnung kann nur für ausgestellte oder überfällige Rechnungen versendet werden.'], 422);
        }

        $nextLevel = ($invoice->reminder_level ?? 0) + 1;
        if ($nextLevel > 3) {
            return response()->json(['message' => 'Maximale Mahnstufe (3) bereits erreicht.'], 422);
        }

        $settings = $this->getOrCreateSettings();
        $levelConfig = $settings->getLevelConfig($nextLevel);

        // DunningLog erstellen
        $log = DunningLog::create([
            'tenant_id'       => Auth::user()->tenant_id,
            'invoice_id'      => $invoice->id,
            'level'           => $nextLevel,
            'fee_cents'       => $levelConfig['fee_cents'],
            'sent_at'         => now(),
            'sent_by_user_id' => Auth::id(),
            'notes'           => $request->notes,
        ]);

        // PDF generieren
        try {
            $pdfPath = $this->generateDunningPdf($invoice, $log, $levelConfig);
            $log->update(['pdf_path' => $pdfPath]);
        } catch (\Exception $e) {
            \Log::warning('Dunning PDF generation failed', ['error' => $e->getMessage()]);
        }

        // Invoice aktualisieren
        $invoice->update([
            'reminder_level'     => $nextLevel,
            'last_reminder_date' => today(),
            'status'             => $invoice->status === 'issued' ? 'overdue' : $invoice->status,
        ]);

        // Audit-Log
        InvoiceAuditLog::create([
            'tenant_id'  => Auth::user()->tenant_id,
            'invoice_id' => $invoice->id,
            'user_id'    => Auth::id(),
            'action'     => InvoiceAuditLog::ACTION_REMINDER_SENT,
            'new_values' => ['level' => $nextLevel, 'fee_cents' => $levelConfig['fee_cents']],
        ]);

        return response()->json([
            'message'      => "Mahnstufe {$nextLevel} wurde erfasst.",
            'dunning_log'  => [
                'id'          => $log->id,
                'level'       => $log->level,
                'level_label' => $log->level_label,
                'fee_eur'     => $log->fee_cents / 100,
                'sent_at'     => $log->sent_at->toIso8601String(),
                'pdf_path'    => $log->pdf_path,
            ],
            'reminder_level' => $nextLevel,
        ]);
    }

    // ── PDF herunterladen ────────────────────────────────────────────────────

    public function downloadDunningPdf(Invoice $invoice, DunningLog $log)
    {
        if ($log->invoice_id !== $invoice->id) {
            abort(403);
        }

        if (!$log->pdf_path || !Storage::disk('public')->exists(str_replace('storage/', '', $log->pdf_path))) {
            // Neu generieren
            $settings    = $this->getOrCreateSettings();
            $levelConfig = $settings->getLevelConfig($log->level);
            $pdfPath     = $this->generateDunningPdf($invoice, $log, $levelConfig);
            $log->update(['pdf_path' => $pdfPath]);
        }

        $storagePath = storage_path('app/public/' . str_replace('storage/', '', $log->pdf_path));
        $filename    = "Mahnung_Stufe{$log->level}_{$invoice->invoice_number}.pdf";

        return response()->download($storagePath, $filename);
    }

    // ── Einstellungen ────────────────────────────────────────────────────────

    public function getSettings()
    {
        return response()->json($this->getOrCreateSettings());
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'level1_days_after_due' => 'integer|min:0',
            'level1_fee_cents'      => 'integer|min:0',
            'level1_subject'        => 'string|max:255',
            'level1_body'           => 'string|max:5000',
            'level2_days_after_due' => 'integer|min:0',
            'level2_fee_cents'      => 'integer|min:0',
            'level2_subject'        => 'string|max:255',
            'level2_body'           => 'string|max:5000',
            'level3_days_after_due' => 'integer|min:0',
            'level3_fee_cents'      => 'integer|min:0',
            'level3_subject'        => 'string|max:255',
            'level3_body'           => 'string|max:5000',
            'auto_escalate'         => 'boolean',
        ]);

        $settings = $this->getOrCreateSettings();
        $settings->update($data);

        return response()->json($settings->fresh());
    }

    // ── Auto-Eskalation (wird vom Artisan Command aufgerufen) ────────────────

    public function autoEscalate(): int
    {
        $settings = DunningSetting::all()->keyBy('tenant_id');
        $escalated = 0;

        $invoices = Invoice::with('dunningLogs')
            ->whereIn('status', ['issued', 'overdue'])
            ->where('due_date', '<', today())
            ->where(fn($q) => $q->whereNull('reminder_level')->orWhere('reminder_level', '<', 3))
            ->get();

        foreach ($invoices as $invoice) {
            $tenantSettings = $settings[$invoice->tenant_id] ?? null;
            if (!$tenantSettings || !$tenantSettings->auto_escalate) {
                continue;
            }

            $currentLevel = $invoice->reminder_level ?? 0;
            $nextLevel    = $currentLevel + 1;

            if ($nextLevel > 3) continue;

            $levelConfig    = $tenantSettings->getLevelConfig($nextLevel);
            $daysAfterDue   = (int) Carbon::parse($invoice->due_date)->diffInDays(today());

            if ($daysAfterDue < $levelConfig['days_after_due']) continue;

            // Nicht nochmal senden wenn bereits auf diesem Level
            $alreadySent = $invoice->dunningLogs->where('level', $nextLevel)->count();
            if ($alreadySent > 0) continue;

            try {
                $log = DunningLog::create([
                    'tenant_id'  => $invoice->tenant_id,
                    'invoice_id' => $invoice->id,
                    'level'      => $nextLevel,
                    'fee_cents'  => $levelConfig['fee_cents'],
                    'sent_at'    => now(),
                ]);

                $invoice->update([
                    'reminder_level'     => $nextLevel,
                    'last_reminder_date' => today(),
                    'status'             => 'overdue',
                ]);

                $escalated++;
            } catch (\Exception $e) {
                \Log::error('Auto-escalation failed for invoice ' . $invoice->id, ['error' => $e->getMessage()]);
            }
        }

        return $escalated;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function getOrCreateSettings(): DunningSetting
    {
        $tenantId = Auth::user()->tenant_id;
        return DunningSetting::firstOrCreate(['tenant_id' => $tenantId]);
    }

    private function generateDunningPdf(Invoice $invoice, DunningLog $log, array $levelConfig): string
    {
        $dueDate    = Carbon::today()->addDays(14)->format('d.m.Y');
        $feeCents   = $levelConfig['fee_cents'];
        $totalDue   = ($invoice->amount_gross / 100) + ($feeCents / 100);

        $body = strtr($levelConfig['body'], [
            '{{invoice_number}}' => $invoice->invoice_number,
            '{{invoice_date}}'   => $invoice->date?->format('d.m.Y') ?? '',
            '{{amount_gross}}'   => number_format($invoice->amount_gross / 100, 2, ',', '.') . ' €',
            '{{due_date}}'       => $invoice->due_date?->format('d.m.Y') ?? '',
            '{{new_due_date}}'   => $dueDate,
            '{{fee}}'            => number_format($feeCents / 100, 2, ',', '.') . ' €',
        ]);

        $html = view('pdf.dunning', [
            'invoice'          => $invoice,
            'log'              => $log,
            'body'             => $body,
            'fee_eur'          => $feeCents / 100,
            'total_due_eur'    => $totalDue,
            'new_due_date'     => $dueDate,
            'level_label'      => $log->level_label,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $content = $pdf->output();

        $filename = "dunning_{$invoice->invoice_number}_level{$log->level}.pdf";
        Storage::disk('public')->put('dunning/' . $filename, $content);

        return 'storage/dunning/' . $filename;
    }
}
