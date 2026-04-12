<?php

namespace App\Jobs;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Async job für PDF-Generierung von Invoices
 * Blockiert nicht den eigentlichen Request
 */
class GenerateInvoicePdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120; // 2 minutes max
    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(public Invoice $invoice) {}

    public function handle()
    {
        try {
            // Generate HTML from template
            $html = \view('invoices.pdf', [
                'invoice' => $this->invoice->load(['items', 'customer', 'tenant']),
            ])->render();

            // Generate PDF
            $pdf = Pdf::loadHTML($html)
                ->setOption('defaultFont', 'Helvetica')
                ->setOption('margin-top', 15)
                ->setOption('margin-bottom', 15)
                ->setOption('margin-left', 15)
                ->setOption('margin-right', 15)
                ->setOption('page-size', 'A4')
                ->setOption('encoding', 'UTF-8');

            // Create file path with date
            $fileName = sprintf(
                'invoices/inv_%s_%s.pdf',
                $this->invoice->invoice_number,
                now()->format('Ymd')
            );

            // Store PDF file
            Storage::disk('local')->put($fileName, $pdf->output());

            // Update invoice with PDF path
            $this->invoice->update([
                'pdf_path' => $fileName,
                'pdf_generated_at' => now(),
            ]);

            Log::info('Invoice PDF generated', [
                'invoice_id' => $this->invoice->id,
                'file_path' => $fileName,
            ]);

            // Trigger event for real-time notification
            \event(new \App\Events\InvoicePdfGenerated($this->invoice));

        } catch (\Exception $e) {
            Log::error('PDF generation failed', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Rethrow to trigger retry
            throw $e;
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::error('Invoice PDF generation permanently failed', [
            'invoice_id' => $this->invoice->id,
            'error' => $exception->getMessage(),
        ]);

        // Mark invoice as failed PDF generation
        $this->invoice->update([
            'pdf_path' => null,
            'pdf_generation_failed' => true,
        ]);
    }
}
