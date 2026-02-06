<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    public function index()
    {
        return response()->json(Invoice::with(['project', 'customer'])->get());
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
            'status' => 'in:pending,paid,overdue,deleted',
        ]);

        $invoice = Invoice::create($validated);

        // Generate PDF
        try {
            $customer = \App\Models\Customer::find($validated['customer_id']);
            $project = \App\Models\Project::with('positions')->find($validated['project_id']);

            $buyer = new \LaravelDaily\Invoices\Classes\Buyer([
                'name' => $customer->company_name,
                'custom_fields' => [
                    'email' => $customer->email,
                ],
            ]);

            $items = [];
            foreach ($project->positions as $pos) {
                $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                    ->title($pos->description)
                    ->pricePerUnit($pos->customer_rate)
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
                ->addItem($items[0]); // addItem takes a single item, use addItems for array

            if (count($items) > 1) {
                for ($i = 1; $i < count($items); $i++) {
                    $dailyInvoice->addItem($items[$i]);
                }
            }

            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $dailyInvoice->save('public/invoices/' . $filename);

            $invoice->update(['pdf_path' => 'storage/invoices/' . $filename]);

        } catch (\Exception $e) {
            // Log error but continue
            \Log::error('Invoice PDF generation failed: ' . $e->getMessage());
        }

        return response()->json($invoice, 201);
    }

    public function show($id)
    {
        return response()->json(Invoice::with(['project', 'customer'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        $validated = $request->validate([
            'status' => 'string|in:pending,paid,overdue,deleted',
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
}
