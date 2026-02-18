<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceAuditLog;
use horstoeko\zugferdlaravel\Facades\ZugferdLaravel;
use horstoeko\zugferd\codelists\ZugferdInvoiceType;
use horstoeko\zugferd\codelists\ZugferdVatCategoryCodes;
use horstoeko\zugferd\codelists\ZugferdPaymentMeans;
use horstoeko\zugferd\ZugferdProfiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * InvoiceController — GoBD-Compliant
 *
 * KEY RULES:
 * 1. All amounts stored as INTEGER CENTS (15050 = 150,50 €)
 * 2. Frontend sends EUR (150.50), backend converts to cents (* 100)
 * 3. Invoices are immutable once issued (is_locked = true)
 * 4. No hard deletes — use Storno (credit note) workflow
 * 5. Sequential, gap-free invoice numbering per tenant per year
 * 6. Customer/seller/project data is snapshotted at issue time
 */
class InvoiceController extends Controller
{
    // ─────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────

    /**
     * List all invoices with their items and audit logs.
     */
    public function index()
    {
        return response()->json(
            Invoice::with(['items', 'auditLogs.user', 'creditNote', 'cancelledInvoice'])
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    /**
     * Show a single invoice.
     */
    public function show($id)
    {
        return response()->json(
            Invoice::with(['items', 'auditLogs.user', 'creditNote', 'cancelledInvoice'])
                ->findOrFail($id)
        );
    }

    /**
     * Create a new invoice (always as draft).
     *
     * Accepts EUR amounts from the frontend, converts to cents.
     * Snapshots customer + seller + project data immediately.
     * Creates frozen InvoiceItem records from project positions.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'nullable|string|in:invoice,credit_note',
            'project_id' => 'required|exists:projects,id',
            'customer_id' => 'required|exists:customers,id',
            'date' => 'required|date',
            'due_date' => 'required|date',
            'delivery_date' => 'nullable|date',
            'amount_net' => 'required|numeric',  // EUR from frontend
            'tax_rate' => 'nullable|numeric',
            'amount_tax' => 'required|numeric',  // EUR from frontend
            'amount_gross' => 'required|numeric',  // EUR from frontend
            'shipping' => 'nullable|numeric',
            'discount' => 'nullable|numeric',
            'paid_amount' => 'nullable|numeric',
            'currency' => 'string|max:3',
            'notes' => 'nullable|string',
            'service_period' => 'nullable|string',
            'tax_exemption' => 'nullable|string|in:none,§19_ustg,reverse_charge',
            'items' => 'nullable|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit' => 'nullable|string',
            'items.*.price' => 'required|numeric',
            'items.*.total' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // 1. Generate sequential, gap-free invoice number
            $year = date('Y');
            $tenantId = $request->user()->tenant_id;

            $lastSeq = Invoice::where('tenant_id', $tenantId)
                ->whereYear('date', $year)
                ->max('invoice_number_sequence') ?? 0;

            $newSeq = $lastSeq + 1;
            $invoiceNumber = sprintf('RE-%s-%05d', $year, $newSeq);

            // 2. Load related data for snapshot
            $customer = \App\Models\Customer::findOrFail($validated['customer_id']);
            $project = \App\Models\Project::with('positions')->findOrFail($validated['project_id']);
            $tenant = \App\Models\Tenant::findOrFail($tenantId);

            // 3. Create invoice with cent-based amounts + snapshots
            $invoice = Invoice::create([
                'type' => $validated['type'] ?? Invoice::TYPE_INVOICE,
                'invoice_number' => $invoiceNumber,
                'invoice_number_sequence' => $newSeq,
                'project_id' => $validated['project_id'],
                'customer_id' => $validated['customer_id'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'],
                'delivery_date' => $validated['delivery_date'] ?? null,
                'service_period' => $validated['service_period'] ?? null,
                'tax_exemption' => $validated['tax_exemption'] ?? 'none',

                // EUR → Cents conversion (round to avoid floating-point issues)
                'amount_net' => (int) round(($validated['amount_net']) * 100),
                'tax_rate' => $validated['tax_rate'] ?? 19.00,
                'amount_tax' => (int) round(($validated['amount_tax']) * 100),
                'amount_gross' => (int) round(($validated['amount_gross']) * 100),
                'shipping_cents' => (int) round(($validated['shipping'] ?? 0) * 100),
                'discount_cents' => (int) round(($validated['discount'] ?? 0) * 100),
                'paid_amount_cents' => (int) round(
                    ($validated['paid_amount'] ?? $project->payments()->sum('amount') ?? 0) * 100
                ),
                'currency' => $validated['currency'] ?? 'EUR',
                'notes' => $validated['notes'] ?? null,
                'status' => Invoice::STATUS_DRAFT,
                'is_locked' => false,

                // --- Customer snapshot (§ 14 UStG Pflichtangaben) ---
                'snapshot_customer_name' => $customer->company_name ?: ($customer->first_name . ' ' . $customer->last_name),
                'snapshot_customer_address' => trim(($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? '')),
                'snapshot_customer_zip' => $customer->address_zip,
                'snapshot_customer_city' => $customer->address_city,
                'snapshot_customer_country' => $customer->address_country ?? 'DE',
                'snapshot_customer_vat_id' => $customer->vat_id ?? null,
                'snapshot_customer_leitweg_id' => $customer->leitweg_id ?? null,

                // --- Seller snapshot (§ 14 UStG: eigener Name, Anschrift, StNr) ---
                'snapshot_seller_name' => $tenant->company_name ?: $tenant->name,
                'snapshot_seller_address' => trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? '')),
                'snapshot_seller_zip' => $tenant->address_zip,
                'snapshot_seller_city' => $tenant->address_city,
                'snapshot_seller_country' => $tenant->address_country ?? 'DE',
                'snapshot_seller_tax_number' => $tenant->tax_number,
                'snapshot_seller_vat_id' => $tenant->vat_id,
                'snapshot_seller_bank_name' => $tenant->bank_name,
                'snapshot_seller_bank_iban' => $tenant->bank_iban,
                'snapshot_seller_bank_bic' => $tenant->bank_bic,

                // --- Project snapshot ---
                'snapshot_project_name' => $project->project_name,
                'snapshot_project_number' => $project->project_number,
            ]);

            // 4. Create frozen line items (either from request or from project positions)
            if (isset($validated['items']) && !empty($validated['items'])) {
                foreach ($validated['items'] as $index => $itemData) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'position' => $index + 1,
                        'description' => $itemData['description'],
                        'quantity' => (float) $itemData['quantity'],
                        'unit' => $itemData['unit'] ?? 'Words',
                        'unit_price_cents' => (int) round($itemData['price'] * 100),
                        'total_cents' => (int) round($itemData['total'] * 100),
                        'tax_rate' => $validated['tax_rate'] ?? 19,
                    ]);
                }
            } else {
                $this->createInvoiceItems($invoice, $project, $validated['tax_rate'] ?? 19);
            }

            // 5. Auto-advance project status to "ready_pickup" when invoice is created
            $advancedStatuses = ['ready_pickup', 'completed', 'invoiced', 'archived'];
            if (!in_array($project->status, $advancedStatuses)) {
                $project->update(['status' => 'ready_pickup']);
            }

            // 6. Audit log
            $this->logAuditEvent($invoice, $request, InvoiceAuditLog::ACTION_CREATED, null, Invoice::STATUS_DRAFT);

            return response()->json($invoice->load('items'), 201);
        });
    }

    /**
     * Update an invoice (only while in draft).
     *
     * GoBD: Once is_locked = true, only status/reminder fields may change.
     * The model's boot() guard enforces this at the ORM level.
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        // Explicitly reject changes on locked invoices (clearer error for frontend)
        if ($invoice->is_locked) {
            $allowed = $request->only(['status', 'reminder_level', 'last_reminder_date']);
            if (empty($allowed)) {
                return response()->json([
                    'error' => 'GoBD-Verstoß: Ausgestellte Rechnungen sind unveränderbar. Verwenden Sie den Storno-Workflow.'
                ], 403);
            }

            $oldStatus = $invoice->status;
            $invoice->update($allowed);

            if (isset($allowed['status']) && $allowed['status'] !== $oldStatus) {
                $this->logAuditEvent($invoice, $request, 'status_change', $oldStatus, $allowed['status']);
            }

            return response()->json($invoice);
        }

        // Draft invoices: allow broader updates
        $validated = $request->validate([
            'date' => 'date',
            'due_date' => 'date',
            'delivery_date' => 'nullable|date',
            'amount_net' => 'numeric',
            'tax_rate' => 'numeric',
            'amount_tax' => 'numeric',
            'amount_gross' => 'numeric',
            'shipping' => 'nullable|numeric',
            'discount' => 'nullable|numeric',
            'paid_amount' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'service_period' => 'nullable|string',
            'tax_exemption' => 'nullable|string|in:none,§19_ustg,reverse_charge',
            'status' => 'string|in:draft',
            'items' => 'nullable|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit' => 'nullable|string',
            'items.*.price' => 'required|numeric',
            'items.*.total' => 'required|numeric',
        ]);

        // Convert EUR → cents if amounts provided
        foreach (['amount_net', 'amount_tax', 'amount_gross'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = (int) round($validated[$field] * 100);
            }
        }

        if (isset($validated['shipping']))
            $validated['shipping_cents'] = (int) round($validated['shipping'] * 100);
        if (isset($validated['discount']))
            $validated['discount_cents'] = (int) round($validated['discount'] * 100);
        if (isset($validated['paid_amount']))
            $validated['paid_amount_cents'] = (int) round($validated['paid_amount'] * 100);

        return DB::transaction(function () use ($invoice, $validated) {
            // Invalidate PDF cache on update
            $invoice->pdf_path = null;
            $invoice->update($validated);

            // Update items if provided
            if (isset($validated['items'])) {
                // Delete old items
                $invoice->items()->delete();

                // Create new ones
                foreach ($validated['items'] as $index => $itemData) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'position' => $index + 1,
                        'description' => $itemData['description'],
                        'quantity' => (float) $itemData['quantity'],
                        'unit' => $itemData['unit'] ?? 'Words',
                        'unit_price_cents' => (int) round($itemData['price'] * 100),
                        'total_cents' => (int) round($itemData['total'] * 100),
                        'tax_rate' => $validated['tax_rate'] ?? $invoice->tax_rate ?? 19,
                    ]);
                }
            }

            return response()->json($invoice->fresh('items'));
        });
    }

    /**
     * Delete a draft invoice.
     *
     * GoBD: Only draft invoices may be deleted.
     * Issued invoices must use the Storno workflow.
     */
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);

        if ($invoice->is_locked || $invoice->status !== Invoice::STATUS_DRAFT) {
            return response()->json([
                'error' => 'Nur Entwürfe können gelöscht werden. Verwenden Sie "Stornieren" für ausgestellte Rechnungen.'
            ], 403);
        }

        $invoice->delete();
        return response()->json(['message' => 'Rechnungsentwurf gelöscht']);
    }

    // ─────────────────────────────────────────────────────────────────
    // WORKFLOW ACTIONS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Issue a draft invoice (draft → issued).
     *
     * This is the critical GoBD transition:
     * 1. Re-snapshots all data (customer might have changed since draft creation)
     * 2. Locks the invoice (is_locked = true)
     * 3. Generates PDF + ZUGFeRD XML
     * 4. Sets issued_at timestamp
     *
     * After this point, the invoice is IMMUTABLE.
     */
    public function issue(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->canBeIssued()) {
            return response()->json([
                'error' => 'Nur Entwürfe können ausgestellt werden. Aktueller Status: ' . $invoice->status
            ], 422);
        }

        return DB::transaction(function () use ($invoice, $request) {
            // 1. Re-snapshot (customer/tenant data might have changed since draft)
            $customer = \App\Models\Customer::find($invoice->customer_id);
            $tenant = \App\Models\Tenant::find($invoice->tenant_id);
            $project = \App\Models\Project::find($invoice->project_id);

            if ($customer) {
                $invoice->snapshot_customer_name = $customer->company_name ?: ($customer->first_name . ' ' . $customer->last_name);
                $invoice->snapshot_customer_address = trim(($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? ''));
                $invoice->snapshot_customer_zip = $customer->address_zip;
                $invoice->snapshot_customer_city = $customer->address_city;
                $invoice->snapshot_customer_country = $customer->address_country ?? 'DE';
                $invoice->snapshot_customer_vat_id = $customer->vat_id ?? null;
                $invoice->snapshot_customer_leitweg_id = $customer->leitweg_id ?? null;
            }

            if ($tenant) {
                $invoice->snapshot_seller_name = $tenant->company_name ?: $tenant->name;
                $invoice->snapshot_seller_address = trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? ''));
                $invoice->snapshot_seller_zip = $tenant->address_zip;
                $invoice->snapshot_seller_city = $tenant->address_city;
                $invoice->snapshot_seller_country = $tenant->address_country ?? 'DE';
                $invoice->snapshot_seller_tax_number = $tenant->tax_number;
                $invoice->snapshot_seller_vat_id = $tenant->vat_id;
                $invoice->snapshot_seller_bank_name = $tenant->bank_name;
                $invoice->snapshot_seller_bank_iban = $tenant->bank_iban;
                $invoice->snapshot_seller_bank_bic = $tenant->bank_bic;
            }

            if ($project) {
                $invoice->snapshot_project_name = $project->project_name;
                $invoice->snapshot_project_number = $project->project_number;
            }

            // 2. Lock and set status
            $oldStatus = $invoice->status;
            $invoice->status = Invoice::STATUS_ISSUED;
            $invoice->issued_at = now();
            $invoice->is_locked = true;
            $invoice->save();

            // 3. Generate PDF + ZUGFeRD
            try {
                $this->generatePdfInternal($invoice);
            } catch (\Throwable $e) {
                Log::error('PDF generation failed during issue: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
                // Don't rollback — the invoice is still issued even if PDF fails
            }

            // 4. Audit log
            $this->logAuditEvent($invoice, $request, InvoiceAuditLog::ACTION_ISSUED, $oldStatus, Invoice::STATUS_ISSUED);

            return response()->json($invoice->load('items'));
        });
    }

    /**
     * Cancel an issued invoice (Storno-Workflow).
     *
     * GoBD: Issued invoices may NOT be deleted or modified.
     * Instead, a Storno-Rechnung (Gutschrift / credit note) with negated
     * amounts is created and linked to the original invoice.
     *
     * Steuerrechtlicher Hintergrund:
     * Nach § 14 Abs. 2 UStG können Rechnungen nur durch Ausstellung einer
     * berichtigenden Rechnung (Gutschrift/Storno) korrigiert werden.
     * Das Original bleibt im System erhalten (Aufbewahrungspflicht 10 Jahre).
     */
    public function cancel(Request $request, $id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        if (!$invoice->canBeCancelled()) {
            return response()->json([
                'error' => 'Diese Rechnung kann nicht storniert werden. Status: ' . $invoice->status
            ], 422);
        }

        // Check if already cancelled
        if ($invoice->creditNote) {
            return response()->json([
                'error' => 'Diese Rechnung wurde bereits storniert. Storno-Nr.: ' . $invoice->creditNote->invoice_number
            ], 422);
        }

        return DB::transaction(function () use ($invoice, $request) {
            $year = date('Y');
            $tenantId = $request->user()->tenant_id;

            // Sequential number for the credit note (same number series!)
            $lastSeq = Invoice::where('tenant_id', $tenantId)
                ->whereYear('date', $year)
                ->max('invoice_number_sequence') ?? 0;

            $newSeq = $lastSeq + 1;
            $creditNoteNumber = sprintf('RE-%s-%05d', $year, $newSeq);

            // 1. Create credit note with negated amounts
            $creditNote = Invoice::create([
                'type' => Invoice::TYPE_CREDIT_NOTE,
                'invoice_number' => $creditNoteNumber,
                'invoice_number_sequence' => $newSeq,
                'cancelled_invoice_id' => $invoice->id,
                'project_id' => $invoice->project_id,
                'customer_id' => $invoice->customer_id,
                'date' => now()->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'delivery_date' => $invoice->delivery_date,
                'service_period' => $invoice->service_period,
                'tax_exemption' => $invoice->tax_exemption,

                // Negated amounts (Gutschrift)
                'amount_net' => -$invoice->amount_net,
                'tax_rate' => $invoice->tax_rate,
                'amount_tax' => -$invoice->amount_tax,
                'amount_gross' => -$invoice->amount_gross,

                'currency' => $invoice->currency,
                'notes' => 'Storno zu Rechnung ' . $invoice->invoice_number .
                    ($request->input('reason') ? '. Grund: ' . $request->input('reason') : ''),
                'status' => Invoice::STATUS_DRAFT,
                'is_locked' => false,
                'issued_at' => null,

                // Copy all snapshots from original (GoBD: same data as original)
                'snapshot_customer_name' => $invoice->snapshot_customer_name,
                'snapshot_customer_address' => $invoice->snapshot_customer_address,
                'snapshot_customer_zip' => $invoice->snapshot_customer_zip,
                'snapshot_customer_city' => $invoice->snapshot_customer_city,
                'snapshot_customer_country' => $invoice->snapshot_customer_country,
                'snapshot_customer_vat_id' => $invoice->snapshot_customer_vat_id,
                'snapshot_customer_leitweg_id' => $invoice->snapshot_customer_leitweg_id,
                'snapshot_seller_name' => $invoice->snapshot_seller_name,
                'snapshot_seller_address' => $invoice->snapshot_seller_address,
                'snapshot_seller_zip' => $invoice->snapshot_seller_zip,
                'snapshot_seller_city' => $invoice->snapshot_seller_city,
                'snapshot_seller_country' => $invoice->snapshot_seller_country,
                'snapshot_seller_tax_number' => $invoice->snapshot_seller_tax_number,
                'snapshot_seller_vat_id' => $invoice->snapshot_seller_vat_id,
                'snapshot_seller_bank_name' => $invoice->snapshot_seller_bank_name,
                'snapshot_seller_bank_iban' => $invoice->snapshot_seller_bank_iban,
                'snapshot_seller_bank_bic' => $invoice->snapshot_seller_bank_bic,
                'snapshot_project_name' => $invoice->snapshot_project_name,
                'snapshot_project_number' => $invoice->snapshot_project_number,
            ]);

            // 2. Create negated line items
            foreach ($invoice->items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $creditNote->id,
                    'position' => $item->position,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_price_cents' => -$item->unit_price_cents,
                    'total_cents' => -$item->total_cents,
                    'tax_rate' => $item->tax_rate,
                ]);
            }

            // 3. Mark original as cancelled
            $oldStatus = $invoice->status;
            $invoice->status = Invoice::STATUS_CANCELLED;
            $invoice->save();

            // 4. PDF generation skipped for draft (will be generated on issue)

            // 5. Audit logs
            $this->logAuditEvent($invoice, $request, InvoiceAuditLog::ACTION_CANCELLED, $oldStatus, Invoice::STATUS_CANCELLED, [
                'credit_note_id' => $creditNote->id,
                'credit_note_number' => $creditNoteNumber,
                'reason' => $request->input('reason'),
            ]);

            $this->logAuditEvent($creditNote, $request, InvoiceAuditLog::ACTION_CREATED, null, Invoice::STATUS_DRAFT, [
                'original_invoice_id' => $invoice->id,
                'type' => 'credit_note',
            ]);

            // 6. Release project for new invoicing (remove invoiced status if applicable)
            if ($invoice->project_id) {
                $project = \App\Models\Project::find($invoice->project_id);
                if ($project && $project->status === 'invoiced') {
                    $project->update(['status' => 'completed']);
                }
            }

            return response()->json([
                'original' => $invoice->fresh()->load('items'),
                'credit_note' => $creditNote->load('items'),
                'message' => 'Rechnung storniert. Gutschrift-Entwurf ' . $creditNoteNumber . ' erstellt.',
            ]);
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // BULK OPERATIONS
    // ─────────────────────────────────────────────────────────────────

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id',
            'data' => 'required|array',
        ]);

        // Only allow safe status transitions in bulk
        $allowedFields = ['status', 'reminder_level', 'last_reminder_date'];
        $updateData = array_intersect_key($validated['data'], array_flip($allowedFields));

        if (empty($updateData)) {
            return response()->json(['error' => 'Keine erlaubten Felder für Massenaktualisierung.'], 422);
        }

        Invoice::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Rechnungen aktualisiert']);
    }

    // ─────────────────────────────────────────────────────────────────
    // PDF & ZUGFERD GENERATION
    // ─────────────────────────────────────────────────────────────────

    /**
     * Generate PDF for an invoice (public endpoint).
     */
    public function generatePdf($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);
        $this->generatePdfInternal($invoice);
        return response()->json($invoice->fresh());
    }

    /**
     * Internal PDF generation using snapshot data only.
     */
    private function generatePdfInternal(Invoice $invoice): void
    {
        $invoice->load('items');

        // Build line items from frozen InvoiceItem records
        $dailyItems = [];
        foreach ($invoice->items as $item) {
            $dailyItems[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                ->title($item->description)
                ->pricePerUnit($item->unit_price_eur) // Uses cent → EUR accessor
                ->quantity((float) $item->quantity)
                ->units($item->unit);
        }

        $buyer = new \LaravelDaily\Invoices\Classes\Buyer([
            'name' => $invoice->snapshot_customer_name,
            'custom_fields' => [
                'address' => trim($invoice->snapshot_customer_address . "\n" .
                    $invoice->snapshot_customer_zip . ' ' . $invoice->snapshot_customer_city . "\n" .
                    $invoice->snapshot_customer_country),
                'due_date' => $invoice->due_date ? $invoice->due_date->format('d.m.Y') : null,
                'customer_id' => $invoice->customer_id,
                'paid_amount' => $invoice->paid_amount_eur,
                'service_period' => $invoice->service_period,
                'tenant_id' => $invoice->tenant_id,
                'invoice_type' => $invoice->type,
            ],
        ]);

        // Fallback: if no items exist, use the invoice total
        if (empty($dailyItems)) {
            $dailyItems[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                ->title($invoice->snapshot_project_name ?: 'Dienstleistung')
                ->pricePerUnit($invoice->amount_net_eur)
                ->quantity(1);
        }

        $dailyInvoice = \LaravelDaily\Invoices\Invoice::make($invoice->invoice_number)
            ->buyer($buyer)
            ->date($invoice->date)
            ->currencySymbol('€')
            ->currencyCode('EUR')
            ->currencyDecimals(2)
            ->taxRate((float) $invoice->tax_rate)
            ->shipping($invoice->shipping_eur)
            ->totalDiscount($invoice->discount_eur)
            ->notes($this->buildInvoiceNotes($invoice))
            ->template('din5008');

        foreach ($dailyItems as $item) {
            $dailyInvoice->addItem($item);
        }

        $dailyInvoice->render();
        $pdfContent = $dailyInvoice->output;

        // Enhance with ZUGFeRD XML
        $pdfContent = $this->enhanceWithZugferd($invoice, $pdfContent);

        $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
        Storage::disk('public')->put('invoices/' . $filename, $pdfContent);
        $invoice->pdf_path = 'storage/invoices/' . $filename;
        $invoice->save();
    }

    /**
     * Build invoice notes with mandatory tax hints.
     *
     * § 14 UStG requires specific text for tax-exempt invoices.
     */
    private function buildInvoiceNotes(Invoice $invoice): string
    {
        $notes = '';

        if ($invoice->tax_exemption === Invoice::TAX_SMALL_BUSINESS) {
            // Kleinunternehmerregelung (§ 19 UStG)
            // Pflichthinweis: "Kein Ausweis von Umsatzsteuer aufgrund
            // der Anwendung der Kleinunternehmerregelung gem. § 19 UStG."
            $notes .= "Kein Ausweis von Umsatzsteuer aufgrund der Anwendung der Kleinunternehmerregelung gemäß § 19 UStG.\n";
        } elseif ($invoice->tax_exemption === Invoice::TAX_REVERSE_CHARGE) {
            // Reverse-Charge-Verfahren (§ 13b UStG)
            // Pflichthinweis: Der Leistungsempfänger schuldet die Steuer.
            $notes .= "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge gem. § 13b UStG).\n";
        }

        if ($invoice->service_period) {
            $notes .= "Leistungszeitraum: " . $invoice->service_period . "\n";
        }

        if ($invoice->isCreditNote()) {
            $notes .= "Diese Gutschrift storniert die Rechnung Nr. " . ($invoice->cancelledInvoice?->invoice_number ?? '-') . ".\n";
        }

        if ($invoice->notes) {
            $notes .= $invoice->notes;
        }

        return trim($notes);
    }

    /**
     * Enhances a PDF with ZUGFeRD XML metadata.
     *
     * Uses SNAPSHOT data only — never reads from FK relations.
     * Supports both regular invoices and credit notes (Storno).
     */
    private function enhanceWithZugferd(Invoice $invoice, string $pdfContent): string
    {
        try {
            $documentBuilder = $this->createZugferdBuilder($invoice);

            // Merge ZUGFeRD XML into PDF
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir))
                mkdir($tempDir, 0755, true);

            $tempPdf = $tempDir . '/zugferd_' . uniqid() . '.pdf';
            ZugferdLaravel::buildMergedPdfByDocumentBuilder($documentBuilder, $pdfContent, $tempPdf);

            $enhancedPdfContent = file_get_contents($tempPdf);
            unlink($tempPdf);

            return $enhancedPdfContent;

        } catch (\Exception $e) {
            Log::error('ZUGFeRD enhancement failed: ' . $e->getMessage());
            return $pdfContent; // Fallback to non-ZUGFeRD PDF
        }
    }

    /**
     * Create the ZUGFeRD Document Builder with all data populated.
     */
    private function createZugferdBuilder(Invoice $invoice)
    {
        $invoice->load('items');

        $sellerCountry = $this->getCountryCode($invoice->snapshot_seller_country);
        $buyerCountry = $this->getCountryCode($invoice->snapshot_customer_country);

        // Fetch seller contact details — TenantSetting first, Tenant model as fallback
        $tenantModel = \App\Models\Tenant::find($invoice->tenant_id);
        $sellerEmail = \App\Models\TenantSetting::where('tenant_id', $invoice->tenant_id)->where('key', 'company_email')->value('value')
            ?: ($tenantModel?->email ?? null);
        $sellerPhone = \App\Models\TenantSetting::where('tenant_id', $invoice->tenant_id)->where('key', 'phone')->value('value')
            ?: ($tenantModel?->phone ?? null);

        // Use XRechnung 3.0 Profile explicitly for E-Rechnung compliance
        $documentBuilder = ZugferdLaravel::createDocumentInXRechnung30Profile();

        // Document type: Invoice or Credit Note
        $docType = $invoice->isCreditNote()
            ? ZugferdInvoiceType::CREDITNOTE
            : ZugferdInvoiceType::INVOICE;

        $documentBuilder->setDocumentInformation(
            $invoice->invoice_number,
            $docType,
            $invoice->date,
            $invoice->currency ?: 'EUR'
        );

        // Seller (from snapshot)
        $documentBuilder->setDocumentSeller(
            $invoice->snapshot_seller_name,
            $invoice->tenant_id
        );
        $documentBuilder->setDocumentSellerAddress(
            $invoice->snapshot_seller_address,
            null,
            null,
            $invoice->snapshot_seller_zip,
            $invoice->snapshot_seller_city,
            $sellerCountry
        );

        // BR-DE-5 (BT-41) and BR-DE-7 (BT-43) are mandatory for XRechnung
        // BT-41: Contact point name — fall back to seller name if not set
        // BT-43: Contact email — mandatory, use whatever we have
        $documentBuilder->setDocumentSellerContact(
            $invoice->snapshot_seller_name, // BT-41: Contact point name (mandatory)
            null,                            // Contact Department
            $sellerPhone ?: null,            // BT-40: Phone
            null,                            // Fax
            $sellerEmail ?: null             // BT-43: Email (mandatory)
        );

        if ($invoice->snapshot_seller_vat_id) {
            $documentBuilder->addDocumentSellerVATRegistrationNumber($invoice->snapshot_seller_vat_id);
        }
        if ($invoice->snapshot_seller_tax_number) {
            $documentBuilder->addDocumentSellerTaxNumber($invoice->snapshot_seller_tax_number);
        }

        // Buyer (from snapshot)
        $documentBuilder->setDocumentBuyer(
            $invoice->snapshot_customer_name,
            $invoice->customer_id
        );
        // BR-11: postcode (BT-53), city (BT-52), country (BT-55) are mandatory
        $documentBuilder->setDocumentBuyerAddress(
            $invoice->snapshot_customer_address,
            null,
            null,
            $invoice->snapshot_customer_zip,
            $invoice->snapshot_customer_city,
            $buyerCountry
        );

        if ($invoice->snapshot_customer_vat_id) {
            $documentBuilder->addDocumentBuyerVATRegistrationNumber($invoice->snapshot_customer_vat_id);
        }

        // Mandatory Buyer Reference - Fallback to Customer ID if no Leitweg-ID
        $buyerRef = $invoice->snapshot_customer_leitweg_id ?: (string) $invoice->customer_id;
        $documentBuilder->setDocumentBuyerReference($buyerRef);

        // Payment Terms
        if ($invoice->due_date) {
            $documentBuilder->addDocumentPaymentTerm(
                'Zahlbar bis ' . $invoice->due_date->format('d.m.Y'),
                $invoice->due_date
            );
        }

        // Payment Means (Bank Transfer - SEPA Credit Transfer is code 58)
        if ($invoice->snapshot_seller_bank_iban) {
            $documentBuilder->addDocumentPaymentMean(
                '58', // SEPA Credit Transfer
                'Banküberweisung',
                null,
                null,
                null,
                null,
                $invoice->snapshot_seller_bank_iban,
                null,
                null,
                $invoice->snapshot_seller_bank_bic
            );
        }

        // Delivery date (Mandatory SupplyChainEvent)
        // Fallback to Service Period End or Invoice Date if no explicit delivery date
        $deliveryDate = $invoice->delivery_date ?: ($invoice->service_period_end ?: $invoice->date);
        $documentBuilder->setDocumentSupplyChainEvent($deliveryDate);

        // Credit note reference
        if ($invoice->isCreditNote() && $invoice->cancelledInvoice) {
            $documentBuilder->addDocumentInvoiceReferencedDocument(
                $invoice->cancelledInvoice->invoice_number,
                $invoice->cancelledInvoice->date
            );
        }

        // Determine tax category based on exemption type
        $taxCategory = ZugferdVatCategoryCodes::STAN_RATE;
        if ($invoice->tax_exemption === Invoice::TAX_REVERSE_CHARGE) {
            $taxCategory = ZugferdVatCategoryCodes::VAT_REVE_CHAR;
        } elseif ($invoice->tax_exemption === Invoice::TAX_SMALL_BUSINESS) {
            $taxCategory = ZugferdVatCategoryCodes::EXEM_FROM_TAX;
        }

        // Line Items (from frozen InvoiceItem records)
        if ($invoice->items->isNotEmpty()) {
            foreach ($invoice->items as $item) {
                $unitCode = $this->mapUnitToUNECE($item->unit);

                // BR-24: BT-131 (line net amount) is mandatory
                $documentBuilder->addNewPosition((string) $item->position)
                    ->setDocumentPositionProductDetails($item->description)
                    ->setDocumentPositionGrossPrice(abs($item->unit_price_eur))
                    ->setDocumentPositionNetPrice(abs($item->unit_price_eur))
                    ->setDocumentPositionQuantity(abs((float) $item->quantity), $unitCode)
                    ->setDocumentPositionLineSummation(abs($item->total_eur));

                $documentBuilder->addDocumentPositionTax(
                    $taxCategory,
                    'VAT',
                    (float) $item->tax_rate
                );
            }
        } else {
            // Fallback
            $documentBuilder->addNewPosition("1")
                ->setDocumentPositionProductDetails($invoice->snapshot_project_name ?: 'Dienstleistung')
                ->setDocumentPositionGrossPrice(abs($invoice->amount_net_eur))
                ->setDocumentPositionNetPrice(abs($invoice->amount_net_eur))
                ->setDocumentPositionQuantity(1, 'C62')
                ->setDocumentPositionLineSummation(abs($invoice->amount_net_eur)); // BR-24: BT-131

            $documentBuilder->addDocumentPositionTax(
                $taxCategory,
                'VAT',
                (float) ($invoice->tax_rate ?? 19)
            );
        }

        // Totals (cents → EUR, abs for credit notes display)
        $netEur = $invoice->amount_net_eur;
        $taxEur = $invoice->amount_tax_eur;
        $grossEur = $invoice->amount_gross_eur;

        $documentBuilder->setDocumentSummation(
            abs($grossEur),  // grandTotalAmount
            abs($grossEur),  // duePayableAmount
            abs($netEur),    // lineTotalAmount
            0,               // chargeTotalAmount
            0,               // allowanceTotalAmount
            abs($netEur),    // taxBasisTotalAmount
            abs($taxEur)     // taxTotalAmount
        );

        // Add tax breakdown
        $exemptionReason = null;
        if ($taxCategory === ZugferdVatCategoryCodes::VAT_REVE_CHAR) {
            $exemptionReason = 'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge gem. § 13b UStG)';
        } elseif ($taxCategory === ZugferdVatCategoryCodes::EXEM_FROM_TAX) {
            $exemptionReason = 'Kleinunternehmerregelung gemäß § 19 UStG';
        }

        $documentBuilder->addDocumentTax(
            $taxCategory,
            'VAT',
            abs($netEur),
            abs($taxEur),
            (float) $invoice->tax_rate,
            $exemptionReason
        );

        return $documentBuilder;
    }

    /**
     * Download the E-Rechnung XML directly.
     */
    public function downloadXml(Request $request, Invoice $invoice)
    {
        try {
            $documentBuilder = $this->createZugferdBuilder($invoice);
            $xmlContent = $documentBuilder->getContent();

            return response($xmlContent, 200, [
                'Content-Type' => 'application/xml',
                'Content-Disposition' => 'attachment; filename="' . $invoice->invoice_number . '.xml"',
            ]);
        } catch (\Exception $e) {
            Log::error("XML Download error: " . $e->getMessage());
            return response()->json(['error' => 'XML Download fehlgeschlagen: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Map translation-industry unit types to UN/ECE Recommendation 20 codes.
     * Required for ZUGFeRD/XRechnung compliance.
     */
    private function mapUnitToUNECE(string $unit): string
    {
        $u = strtolower($unit);
        return match ($u) {
            'hours', 'stunden', 'std' => 'HUR',  // Hour
            // C62 = One (Unit/Stück) - safest for generic items
            'words', 'wörter', 'wort' => 'C62',
            'lines', 'zeilen', 'zeile' => 'C62',
            'pages', 'seiten', 'seite' => 'C62',
            'flat', 'pauschale', 'stk' => 'C62',
            default => 'C62',
        };
    }

    private function getCountryCode(?string $countryName): string
    {
        if (!$countryName)
            return 'DE';
        if (strlen($countryName) === 2)
            return strtoupper($countryName);

        $map = [
            'Deutschland' => 'DE',
            'Österreich' => 'AT',
            'Schweiz' => 'CH',
            'Frankreich' => 'FR',
            'Spanien' => 'ES',
            'Italien' => 'IT',
            'Vereinigtes Königreich' => 'GB',
            'USA' => 'US',
            'Belgien' => 'BE',
            'Niederlande' => 'NL',
            'Polen' => 'PL',
            'Dänemark' => 'DK',
            'Schweden' => 'SE',
            'Norwegen' => 'NO',
            'Finnland' => 'FI',
        ];
        return $map[$countryName] ?? 'DE';
    }

    // ─────────────────────────────────────────────────────────────────
    // DOWNLOAD, PRINT, PREVIEW
    // ─────────────────────────────────────────────────────────────────

    public function preview($id)
    {
        try {
            $invoice = Invoice::with('items')->findOrFail($id);

            // Ensure PDF exists
            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $exists = Storage::disk('public')->exists('invoices/' . $filename);

            if (!$invoice->pdf_path || !$exists) {
                // If force-regenerate for draft or missing
                $this->generatePdfInternal($invoice);
                $invoice->refresh();
            }

            $pdfPath = storage_path('app/public/invoices/' . $filename);

            if (!file_exists($pdfPath)) {
                return response()->json(['error' => 'Vorschau konnte nicht generiert werden.'], 500);
            }

            // Return PDF inline so it can be viewed in iframe
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $invoice->invoice_number . '_preview.pdf"'
            ]);

        } catch (\Throwable $e) {
            Log::error('Preview failed: ' . $e->getMessage());
            return response()->json(['error' => 'Vorschau fehlgeschlagen'], 500);
        }
    }

    public function download(Request $request, Invoice $invoice)
    {
        try {
            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $exists = Storage::disk('public')->exists('invoices/' . $filename);

            if (!$invoice->pdf_path || !$exists) {
                $this->generatePdfInternal($invoice);
                $invoice->refresh();
            }

            $pdfPath = storage_path('app/public/invoices/' . $filename);
            if (!file_exists($pdfPath)) {
                return response()->json(['error' => 'PDF konnte nicht generiert werden'], 404);
            }

            // Audit log
            $this->logAuditEvent($invoice, $request, InvoiceAuditLog::ACTION_DOWNLOADED);

            return response()->download($pdfPath, $invoice->invoice_number . '.pdf');
        } catch (\Exception $e) {
            Log::error("Download error: " . $e->getMessage());
            return response()->json(['error' => 'Download fehlgeschlagen: ' . $e->getMessage()], 500);
        }
    }

    public function print(Request $request, Invoice $invoice)
    {
        try {
            $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
            $exists = Storage::disk('public')->exists('invoices/' . $filename);

            if (!$invoice->pdf_path || !$exists) {
                $this->generatePdfInternal($invoice);
                $invoice->refresh();
            }

            $pdfPath = storage_path('app/public/invoices/' . $filename);
            if (!file_exists($pdfPath)) {
                return response()->json(['error' => 'PDF konnte nicht generiert werden'], 404);
            }

            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $invoice->invoice_number . '.pdf"'
            ]);
        } catch (\Exception $e) {
            Log::error("Print error: " . $e->getMessage());
            return response()->json(['error' => 'Drucken fehlgeschlagen: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // DATEV EXPORT
    // ─────────────────────────────────────────────────────────────────

    /**
     * DATEV export using snapshot data and cent-based amounts.
     */
    public function datevExport(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:invoices,id',
        ]);

        $invoices = Invoice::whereIn('id', $validated['ids'])->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="datev_export_' . date('Ymd_His') . '.csv"',
        ];

        $callback = function () use ($invoices) {
            $file = fopen('php://output', 'w');

            // DATEV header
            fputcsv($file, ['DTVF', '700', '21', 'Buchungsstapel', '1', '', '', '', '', '', 'EXTF', '', '', '', '', ''], ';');

            fputcsv($file, [
                'Umsatz (ohne Komma)',
                'Soll/Haben-Kennzeichen',
                'WKZ',
                'Kurs',
                'Basis-Umsatz',
                'WKZ Basis-Umsatz',
                'Konto',
                'Gegenkonto',
                'BU-Schlüssel',
                'Belegdatum',
                'Belegfeld 1',
                'Buchungstext'
            ], ';');

            foreach ($invoices as $inv) {
                $date = $inv->date->format('dm');
                // Cents → EUR formatted for DATEV
                $amount = number_format($inv->amount_gross_eur, 2, ',', '');
                $customerName = substr($inv->snapshot_customer_name ?? 'Unbekannt', 0, 30);

                $konto = ($inv->tax_exemption === Invoice::TAX_REVERSE_CHARGE) ? '8336' : '8400';
                $gegenkonto = '10000';

                // Credit notes: swap S/H
                $sollHaben = $inv->isCreditNote() ? 'H' : 'S';

                fputcsv($file, [
                    $amount,
                    $sollHaben,
                    'EUR',
                    '',
                    '',
                    '',
                    $gegenkonto,
                    $konto,
                    '',
                    $date,
                    $inv->invoice_number,
                    $customerName
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Create frozen InvoiceItem records from project positions.
     */
    private function createInvoiceItems(Invoice $invoice, $project, float $defaultTaxRate = 19): void
    {
        if ($project->positions && $project->positions->isNotEmpty()) {
            foreach ($project->positions as $index => $pos) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'position' => $index + 1,
                    'description' => $pos->description ?: ($project->project_name . ' - Position ' . ($index + 1)),
                    'quantity' => (float) ($pos->amount ?: $pos->quantity ?: 1),
                    'unit' => $pos->unit ?: 'words',
                    'unit_price_cents' => (int) round(($pos->customer_rate ?? 0) * 100),
                    'total_cents' => (int) round(($pos->customer_total ?? 0) * 100),
                    'tax_rate' => $pos->tax_rate ?? $defaultTaxRate,
                ]);
            }
        } else {
            // Fallback: single line item from invoice total
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'position' => 1,
                'description' => $project->project_name ?: 'Übersetzungsleistung',
                'quantity' => 1,
                'unit' => 'flat',
                'unit_price_cents' => $invoice->amount_net,
                'total_cents' => $invoice->amount_net,
                'tax_rate' => $defaultTaxRate,
            ]);
        }
    }

    /**
     * Build a LaravelDaily Invoice from snapshot data (for preview).
     */
    private function buildDailyInvoiceFromSnapshot(Invoice $invoice)
    {
        $buyer = new \LaravelDaily\Invoices\Classes\Buyer([
            'name' => $invoice->snapshot_customer_name,
            'custom_fields' => [
                'address' => trim($invoice->snapshot_customer_address . "\n" .
                    $invoice->snapshot_customer_zip . ' ' . $invoice->snapshot_customer_city),
                'due_date' => $invoice->due_date ? $invoice->due_date->format('d.m.Y') : '-',
            ],
        ]);

        $items = [];
        foreach ($invoice->items as $item) {
            $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                ->title($item->description)
                ->pricePerUnit(abs($item->unit_price_eur))
                ->quantity(abs((float) $item->quantity))
                ->units($item->unit);
        }

        if (empty($items)) {
            $items[] = (new \LaravelDaily\Invoices\Classes\InvoiceItem())
                ->title($invoice->snapshot_project_name ?: 'Dienstleistung')
                ->pricePerUnit(abs($invoice->amount_net_eur))
                ->quantity(1);
        }

        $dailyInvoice = \LaravelDaily\Invoices\Invoice::make($invoice->invoice_number)
            ->buyer($buyer)
            ->date($invoice->date)
            ->currencySymbol('€')
            ->currencyCode('EUR')
            ->currencyDecimals(2)
            ->taxRate((float) ($invoice->tax_rate ?? 19))
            ->shipping($invoice->shipping_eur)
            ->totalDiscount($invoice->discount_eur)
            ->notes($this->buildInvoiceNotes($invoice))
            ->template('din5008');

        $dailyInvoice->tenant_id = $invoice->tenant_id;
        $dailyInvoice->invoice_type = $invoice->type; // Pass to template

        foreach ($items as $item) {
            $dailyInvoice->addItem($item);
        }

        return $dailyInvoice;
    }

    /**
     * Log an audit event for a given invoice.
     */
    private function logAuditEvent(
        Invoice $invoice,
        Request $request,
        string $action,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        ?array $metadata = null
    ): void {
        InvoiceAuditLog::create([
            'invoice_id' => $invoice->id,
            'user_id' => $request->user()?->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'metadata' => $metadata,
            'ip_address' => $request->ip(),
        ]);
    }
}
