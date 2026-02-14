<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    public function index()
    {
        return response()->json(Invoice::with(['project.positions', 'customer'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:invoices',
            'project_id' => 'required|exists:projects,id',
            'customer_id' => 'required|exists:customers,id',
            'date' => 'required|date',
            'due_date' => 'required|date',
            'amount_net' => 'required|numeric',
            'tax_rate' => 'nullable|numeric',
            'amount_tax' => 'required|numeric',
            'amount_gross' => 'required|numeric',
            'currency' => 'string|max:3',
            'notes' => 'nullable|string',
            'status' => 'in:pending,sent,paid,overdue,cancelled,archived,deleted',
        ]);

        $invoice = Invoice::create($validated);

        // Generate PDF
        try {
            $customer = \App\Models\Customer::find($validated['customer_id']);
            $project = \App\Models\Project::with('positions')->find($validated['project_id']);

            $buyer = new \LaravelDaily\Invoices\Classes\Buyer([
                'name' => $customer->company_name ?? ($customer->first_name . ' ' . $customer->last_name),
                'custom_fields' => [
                    'email' => $customer->email,
                    'customer_id' => $customer->customer_id ?? $customer->id,
                    'address' => trim(
                        ($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? '') . "\n" .
                        ($customer->address_zip ?? '') . ' ' . ($customer->address_city ?? '') . "\n" .
                        ($customer->address_country ?? '')
                    ),
                    'street' => $customer->address_street,
                    'house_no' => $customer->address_house_no,
                    'zip' => $customer->address_zip,
                    'city' => $customer->address_city,
                    'country' => $customer->address_country,
                ],
            ]);

            $items = [];
            foreach ($project->positions as $pos) {
                $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                    ->title($pos->description)
                    ->pricePerUnit((float) $pos->customer_rate)
                    ->quantity($pos->amount); // Using amount as quantity based on project structure
            }

            // If no items (mock or just project total)
            if (empty($items)) {
                $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                    ->title($project->project_name)
                    ->pricePerUnit($validated['amount_net'])
                    ->quantity(1);
            }

            $dailyInvoice = \LaravelDaily\Invoices\Invoice::make()
                ->buyer($buyer)
                ->discountByPercent(0)
                ->taxRate($validated['tax_rate'] ?? 19)
                ->shipping(0)
                ->notes($validated['notes'] ?? '')
                ->template('din5008')
                ->addItem($items[0]); // addItem takes a single item, use addItems for array

            if (count($items) > 1) {
                for ($i = 1; $i < count($items); $i++) {
                    $dailyInvoice->addItem($items[$i]);
                }
            }

            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';

            // Correct rendering for LaravelDaily Invoices
            $dailyInvoice->render();
            $pdfContent = $dailyInvoice->output;
            \Storage::disk('public')->put('invoices/' . $filename, $pdfContent);

            $invoice->update(['pdf_path' => 'storage/invoices/' . $filename]);

        } catch (\Exception $e) {
            // Log error but continue
            \Log::error('Invoice PDF generation failed: ' . $e->getMessage());
        }

        return response()->json($invoice, 201);
    }

    public function show($id)
    {
        return response()->json(Invoice::with(['project.positions', 'customer'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        $validated = $request->validate([
            'status' => 'string|in:pending,sent,paid,overdue,cancelled,archived,deleted',
            'due_date' => 'date',
        ]);

        $invoice->update($validated);
        return response()->json($invoice);
    }

    public function destroy($id)
    {
        Invoice::findOrFail($id)->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id',
            'data' => 'required|array',
        ]);

        Invoice::whereIn('id', $validated['ids'])->update($validated['data']);

        return response()->json(['message' => 'Invoices updated successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id',
        ]);

        Invoice::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Invoices deleted successfully']);
    }

    protected function buildDailyInvoice(Invoice $invoice)
    {
        $invoice->load(['project.positions', 'customer']);
        $customer = $invoice->customer;
        $project = $invoice->project;

        $buyer = new \LaravelDaily\Invoices\Classes\Buyer([
            'name' => $customer->company_name ?? ($customer->first_name . ' ' . $customer->last_name),
            'custom_fields' => [
                'email' => $customer->email,
                'customer_id' => $customer->customer_id ?? $customer->id,
                'address' => trim(
                    ($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? '') . "\n" .
                    ($customer->address_zip ?? '') . ' ' . ($customer->address_city ?? '') . "\n" .
                    ($customer->address_country ?? '')
                ),
                'street' => $customer->address_street,
                'house_no' => $customer->address_house_no,
                'zip' => $customer->address_zip,
                'city' => $customer->address_city,
                'country' => $customer->address_country,
            ],
        ]);

        $items = [];
        if ($project && $project->positions) {
            foreach ($project->positions as $pos) {
                $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                    ->title($pos->description)
                    ->pricePerUnit((float) $pos->customer_rate)
                    ->quantity($pos->amount);
            }
        }

        if (empty($items)) {
            $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                ->title($project ? $project->project_name : 'Rechnung ' . $invoice->invoice_number)
                ->pricePerUnit((float) $invoice->amount_net)
                ->quantity(1);
        }

        $dailyInvoice = \LaravelDaily\Invoices\Invoice::make($invoice->invoice_number)
            ->buyer($buyer)
            ->discountByPercent(0)
            ->taxRate((float) ($invoice->tax_rate ?? 19))
            ->shipping(0)
            ->notes($invoice->notes ?? '')
            ->template('din5008');

        foreach ($items as $item) {
            $dailyInvoice->addItem($item);
        }

        return $dailyInvoice;
    }

    public function generatePdf($id)
    {
        $invoice = Invoice::findOrFail($id);

        try {
            $dailyInvoice = $this->buildDailyInvoice($invoice);
            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';

            $dailyInvoice->render();
            $pdfContent = $dailyInvoice->output;
            \Storage::disk('public')->put('invoices/' . $filename, $pdfContent);

            $invoice->update(['pdf_path' => 'storage/invoices/' . $filename]);

            return $invoice->fresh();
        } catch (\Exception $e) {
            \Log::error('Invoice PDF generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function preview($id)
    {
        $invoice = Invoice::findOrFail($id);
        $dailyInvoice = $this->buildDailyInvoice($invoice);

        // Return the rendered HTML view for preview
        return view('vendor.invoices.templates.din5008', [
            'invoice' => $dailyInvoice,
        ])->render();
    }

    public function download(Invoice $invoice)
    {
        try {
            $id = $invoice->id;
            \Log::info("Download request for invoice ID: {$id}, invoice_number: {$invoice->invoice_number}");

            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $exists = \Storage::disk('public')->exists('invoices/' . $filename);

            if (!$invoice->pdf_path || !$exists) {
                \Log::info("PDF not found, generating...");
                $this->generatePdf($id);
                $invoice->refresh();
            }

            $pdfPath = storage_path('app/public/invoices/' . $filename);

            if (!file_exists($pdfPath)) {
                \Log::error("PDF file still not found at: {$pdfPath}");
                return response()->json(['error' => 'PDF file could not be generated or found'], 404);
            }

            return response()->download($pdfPath, 'Rechnung_' . $invoice->invoice_number . '.pdf');
        } catch (\Exception $e) {
            \Log::error("Download error: " . $e->getMessage());
            return response()->json(['error' => 'Download failed: ' . $e->getMessage()], 500);
        }
    }

    public function print(Invoice $invoice)
    {
        try {
            $id = $invoice->id;
            \Log::info("Print request for invoice ID: {$id}, invoice_number: {$invoice->invoice_number}");

            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $exists = \Storage::disk('public')->exists('invoices/' . $filename);

            if (!$invoice->pdf_path || !$exists) {
                \Log::info("PDF not found, generating...");
                $this->generatePdf($id);
                $invoice->refresh();
            }

            $pdfPath = storage_path('app/public/invoices/' . $filename);

            if (!file_exists($pdfPath)) {
                \Log::error("PDF file still not found at: {$pdfPath}");
                return response()->json(['error' => 'PDF file could not be generated or found'], 404);
            }

            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Rechnung_' . $invoice->invoice_number . '.pdf"'
            ]);
        } catch (\Exception $e) {
            \Log::error("Print error: " . $e->getMessage());
            return response()->json(['error' => 'Print failed: ' . $e->getMessage()], 500);
        }
    }
}
