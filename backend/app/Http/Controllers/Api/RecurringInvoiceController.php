<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\RecurringInvoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        $items = RecurringInvoice::orderBy('next_run_at')->get();

        return response()->json($items->map(fn($r) => $this->format($r)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:200',
            'interval'              => 'required|in:monthly,quarterly,yearly',
            'next_run_at'           => 'required|date',
            'due_days'              => 'integer|min:1|max:365',
            'auto_issue'            => 'boolean',
            'occurrences_limit'     => 'nullable|integer|min:1',
            'notes'                 => 'nullable|string|max:2000',
            // Template source: existing invoice
            'template_invoice_id'   => 'nullable|integer|exists:invoices,id',
            // Or manual items
            'template_customer_id'  => 'required_without:template_invoice_id|integer',
            'template_items'        => 'required_without:template_invoice_id|array|min:1',
            'template_items.*.description' => 'required_without:template_invoice_id|string',
            'template_items.*.quantity'    => 'required_without:template_invoice_id|numeric|min:0.01',
            'template_items.*.unit_price'  => 'required_without:template_invoice_id|integer|min:0',
            'template_items.*.tax_rate'    => 'nullable|numeric',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // Wenn aus bestehender Rechnung
        if (!empty($data['template_invoice_id'])) {
            $invoice = Invoice::with('items')->findOrFail($data['template_invoice_id']);
            $items   = $invoice->items->map(fn($i) => [
                'description'  => $i->description,
                'quantity'     => $i->quantity,
                'unit'         => $i->unit,
                'unit_price'   => $i->unit_price,
                'tax_rate'     => $i->tax_rate,
                'amount_net'   => $i->amount_net,
                'amount_tax'   => $i->amount_tax,
                'amount_gross' => $i->amount_gross,
            ])->toArray();

            $customer = $invoice->customer;
            $data['template_customer_id']    = $invoice->customer_id;
            $data['template_customer_name']  = $invoice->snapshot_customer_name ?? $customer?->company_name ?? '';
            $data['template_items']          = $items;
            $data['template_amount_net_cents']   = $invoice->amount_net;
            $data['template_tax_rate']           = $invoice->tax_rate;
            $data['template_amount_tax_cents']   = $invoice->amount_tax;
            $data['template_amount_gross_cents'] = $invoice->amount_gross;
            $data['template_currency']           = $invoice->currency ?? 'EUR';
            $data['template_intro_text']         = $invoice->intro_text;
            $data['template_footer_text']        = $invoice->footer_text;
            $data['template_notes']              = $invoice->notes;
        } else {
            // Manuelle Eingabe — Beträge berechnen
            $netCents   = 0;
            $taxCents   = 0;
            $grossCents = 0;
            $taxRate    = 19.00;
            $items      = [];

            foreach ($data['template_items'] as $item) {
                $qty      = (float) $item['quantity'];
                $price    = (int) $item['unit_price'];
                $rate     = (float) ($item['tax_rate'] ?? 19);
                $net      = (int) round($qty * $price);
                $tax      = (int) round($net * $rate / 100);
                $gross    = $net + $tax;
                $taxRate  = $rate;
                $netCents   += $net;
                $taxCents   += $tax;
                $grossCents += $gross;

                $items[] = array_merge($item, [
                    'unit'         => $item['unit'] ?? 'Stk.',
                    'amount_net'   => $net,
                    'amount_tax'   => $tax,
                    'amount_gross' => $gross,
                ]);
            }

            $customer = \App\Models\Customer::find($data['template_customer_id']);
            $data['template_customer_name']      = $customer?->company_name ?? trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
            $data['template_items']              = $items;
            $data['template_amount_net_cents']   = $netCents;
            $data['template_tax_rate']           = $taxRate;
            $data['template_amount_tax_cents']   = $taxCents;
            $data['template_amount_gross_cents'] = $grossCents;
            $data['template_currency']           = 'EUR';
        }

        $recurring = RecurringInvoice::create(array_merge($data, [
            'tenant_id'        => $tenantId,
            'customer_id'      => $data['template_customer_id'],
            'status'           => 'active',
            'occurrences_count' => 0,
        ]));

        return response()->json($this->format($recurring), 201);
    }

    public function update(Request $request, RecurringInvoice $recurringInvoice)
    {
        $data = $request->validate([
            'name'              => 'string|max:200',
            'interval'          => 'in:monthly,quarterly,yearly',
            'next_run_at'       => 'date',
            'due_days'          => 'integer|min:1',
            'auto_issue'        => 'boolean',
            'occurrences_limit' => 'nullable|integer|min:1',
            'notes'             => 'nullable|string|max:2000',
        ]);

        $recurringInvoice->update($data);

        return response()->json($this->format($recurringInvoice->fresh()));
    }

    public function pause(RecurringInvoice $recurringInvoice)
    {
        $recurringInvoice->update(['status' => 'paused']);
        return response()->json($this->format($recurringInvoice->fresh()));
    }

    public function activate(RecurringInvoice $recurringInvoice)
    {
        $recurringInvoice->update(['status' => 'active']);
        return response()->json($this->format($recurringInvoice->fresh()));
    }

    public function destroy(RecurringInvoice $recurringInvoice)
    {
        $recurringInvoice->delete();
        return response()->json(['message' => 'Dauerauftrag gelöscht.']);
    }

    public function executeNow(RecurringInvoice $recurringInvoice)
    {
        try {
            $invoice = $recurringInvoice->createInvoice();
            return response()->json([
                'message'    => 'Rechnung erfolgreich erstellt.',
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number ?? null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Manual recurring invoice execution failed', [
                'recurring_id' => $recurringInvoice->id,
                'error'        => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Fehler beim Erstellen der Rechnung: ' . $e->getMessage()], 500);
        }
    }

    private function format(RecurringInvoice $r): array
    {
        return [
            'id'                   => $r->id,
            'name'                 => $r->name,
            'interval'             => $r->interval,
            'interval_label'       => match ($r->interval) {
                'monthly'   => 'Monatlich',
                'quarterly' => 'Quartalsweise',
                'yearly'    => 'Jährlich',
                default     => $r->interval,
            },
            'next_run_at'          => $r->next_run_at?->toDateString(),
            'last_run_at'          => $r->last_run_at?->toDateString(),
            'status'               => $r->status,
            'auto_issue'           => $r->auto_issue,
            'due_days'             => $r->due_days,
            'occurrences_count'    => $r->occurrences_count,
            'occurrences_limit'    => $r->occurrences_limit,
            'customer_id'          => $r->template_customer_id,
            'customer_name'        => $r->template_customer_name,
            'amount_gross_cents'   => $r->template_amount_gross_cents,
            'amount_gross_eur'     => $r->template_amount_gross_cents / 100,
            'currency'             => $r->template_currency,
            'notes'                => $r->notes,
            'template_invoice_id'  => $r->template_invoice_id,
            'created_at'           => $r->created_at->toIso8601String(),
        ];
    }
}
