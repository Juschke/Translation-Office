<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Invoice — GoBD-Compliant Invoice Model
 *
 * KEY DESIGN DECISIONS:
 * 1. All monetary amounts stored as INTEGER CENTS (e.g. 15050 = 150,50 €)
 * 2. Customer/seller/project data is SNAPSHOTTED (frozen) at issue time
 * 3. Once issued (is_locked = true), the record is IMMUTABLE
 * 4. Old FK relations kept for internal reference only, NOT for display
 * 5. Uses Storno-Rechnung (credit note) instead of delete for corrections
 */
class Invoice extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    // ─── Invoice types ───────────────────────────────────────────────
    public const TYPE_INVOICE = 'invoice';
    public const TYPE_CREDIT_NOTE = 'credit_note';

    // ─── Status workflow ─────────────────────────────────────────────
    public const STATUS_DRAFT = 'draft';
    public const STATUS_ISSUED = 'issued';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_ARCHIVED = 'archived';
    public const STATUS_DELETED = 'deleted';

    // ─── Tax exemption types ─────────────────────────────────────────
    public const TAX_NONE = 'none';
    public const TAX_SMALL_BUSINESS = '§19_ustg';       // Kleinunternehmerregelung
    public const TAX_REVERSE_CHARGE = 'reverse_charge'; // Reverse Charge (EU B2B)

    protected $fillable = [
        'type',
        'invoice_number',
        'invoice_number_sequence',
        'project_id',        // Reference only — NOT used for display
        'customer_id',       // Reference only — NOT used for display
        'cancelled_invoice_id',
        'date',
        'due_date',
        'delivery_date',
        'service_period_start',
        'service_period_end',
        'service_period',

        // --- Amounts in CENTS (integer) ---
        'amount_net',
        'tax_rate',
        'amount_tax',
        'amount_gross',

        'currency',
        'payment_method',
        'status',
        'is_locked',
        'issued_at',
        'pdf_path',
        'notes',
        'shipping_cents',
        'discount_cents',
        'paid_amount_cents',
        'tax_exemption',
        'reminder_level',
        'last_reminder_date',

        // --- Customer Snapshot ---
        'snapshot_customer_name',
        'snapshot_customer_address',
        'snapshot_customer_zip',
        'snapshot_customer_city',
        'snapshot_customer_country',
        'snapshot_customer_vat_id',
        'snapshot_customer_email',
        'snapshot_customer_leitweg_id',

        // --- Seller Snapshot ---
        'snapshot_seller_name',
        'snapshot_seller_email',
        'snapshot_seller_address',
        'snapshot_seller_zip',
        'snapshot_seller_city',
        'snapshot_seller_country',
        'snapshot_seller_tax_number',
        'snapshot_seller_vat_id',
        'snapshot_seller_bank_name',
        'snapshot_seller_bank_iban',
        'snapshot_seller_bank_bic',

        // --- Project Snapshot ---
        'snapshot_project_name',
        'snapshot_project_number',
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'delivery_date' => 'date',
        'service_period_start' => 'date',
        'service_period_end' => 'date',
        'issued_at' => 'datetime',
        'last_reminder_date' => 'date',
        'amount_net' => 'integer',
        'amount_tax' => 'integer',
        'amount_gross' => 'integer',
        'shipping_cents' => 'integer',
        'discount_cents' => 'integer',
        'paid_amount_cents' => 'integer',
        'tax_rate' => 'decimal:2',
        'is_locked' => 'boolean',
        'reminder_level' => 'integer',
    ];

    // ─── IMMUTABILITY GUARD (GoBD) ───────────────────────────────────
    //
    // Once an invoice is issued (is_locked = true), only the following
    // fields may be changed: status, reminder_level, last_reminder_date,
    // pdf_path. All other modifications are blocked.
    //
    // Steuerrechtlicher Hintergrund:
    // Die GoBD (Grundsätze ordnungsmäßiger Buchführung) verlangen, dass
    // einmal gebuchte Belege nicht mehr verändert werden dürfen.
    // Korrekturen erfolgen ausschließlich über Storno-Rechnungen.

    protected static function booted(): void
    {
        static::saving(function (Invoice $invoice) {
            if ($invoice->is_locked && $invoice->getOriginal('is_locked')) {
                $allowedFields = ['status', 'reminder_level', 'last_reminder_date', 'pdf_path'];
                $dirty = array_keys($invoice->getDirty());
                $forbidden = array_diff($dirty, $allowedFields);

                if (!empty($forbidden)) {
                    throw new \RuntimeException(
                        'GoBD-Verstoß: Ausgestellte Rechnungen dürfen nicht geändert werden. ' .
                        'Gesperrte Felder: ' . implode(', ', $forbidden) . '. ' .
                        'Verwenden Sie den Storno-Workflow für Korrekturen.'
                    );
                }
            }

            // Automate status transitions
            $invoice->syncStatus();
        });

        // Prevent hard deletion of any invoice (GoBD: Aufbewahrungspflicht)
        static::deleting(function (Invoice $invoice) {
            if ($invoice->is_locked) {
                throw new \RuntimeException(
                    'GoBD-Verstoß: Ausgestellte Rechnungen dürfen nicht gelöscht werden.'
                );
            }

            // Soft delete for drafts: move them to trash instead of hard deletion
            if ($invoice->status !== self::STATUS_DELETED) {
                $invoice->update(['status' => self::STATUS_DELETED]);
                return false; // Cancel the hard delete
            }
        });
    }

    // ─── Cents → EUR Accessors ───────────────────────────────────────

    public function getAmountNetEurAttribute(): float
    {
        return $this->amount_net / 100;
    }

    public function getAmountTaxEurAttribute(): float
    {
        return $this->amount_tax / 100;
    }

    public function getAmountGrossEurAttribute(): float
    {
        return $this->amount_gross / 100;
    }

    public function getShippingEurAttribute(): float
    {
        return $this->shipping_cents / 100;
    }

    public function getDiscountEurAttribute(): float
    {
        return $this->discount_cents / 100;
    }

    public function getPaidAmountEurAttribute(): float
    {
        return $this->paid_amount_cents / 100;
    }

    /**
     * Calculated value: Gross - Paid
     */
    public function getAmountDueEurAttribute(): float
    {
        return ($this->amount_gross - $this->paid_amount_cents) / 100;
    }

    // ─── Relationships ───────────────────────────────────────────────

    /**
     * Frozen line items (NOT linked to project_positions).
     */
    public function items()
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('position');
    }

    /**
     * Audit trail for this invoice.
     */
    public function auditLogs()
    {
        return $this->hasMany(InvoiceAuditLog::class)->orderBy('created_at');
    }

    /**
     * If this is a credit note, the original invoice it cancels.
     */
    public function cancelledInvoice()
    {
        return $this->belongsTo(Invoice::class, 'cancelled_invoice_id');
    }

    /**
     * If this invoice was cancelled, the credit note that cancels it.
     */
    public function creditNote()
    {
        return $this->hasOne(Invoice::class, 'cancelled_invoice_id');
    }

    /**
     * Project reference (for internal use only — NOT for display on invoices).
     * Always use snapshot_project_name / snapshot_project_number for display.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Customer reference (for internal use only — NOT for display on invoices).
     * Always use snapshot_customer_* fields for display.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // ─── Helper Methods ──────────────────────────────────────────────

    /**
     * Check if this invoice is a Storno/Gutschrift (credit note).
     */
    public function isCreditNote(): bool
    {
        return $this->type === self::TYPE_CREDIT_NOTE;
    }

    /**
     * Check if this invoice can still be edited.
     */
    public function isEditable(): bool
    {
        return !$this->is_locked && $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if this invoice can be issued.
     */
    public function canBeIssued(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if this invoice can be cancelled (Storno).
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_ISSUED,
            self::STATUS_PAID,
            self::STATUS_OVERDUE,
        ]);
    }

    /**
     * Automatically synchronize the invoice status based on finances and dates.
     *
     * Rules:
     * 1. Paid: Gross amount is fully covered by paid_amount_cents.
     * 2. Overdue: Due date is in the past and status is not draft/paid/cancelled.
     */
    public function syncStatus(): void
    {
        // Don't touch archived or cancelled invoices
        if (in_array($this->status, [self::STATUS_CANCELLED, self::STATUS_ARCHIVED])) {
            return;
        }

        $gross = $this->amount_gross;
        $paid = $this->paid_amount_cents;

        // 1. Check for full payment
        if ($gross > 0 && $paid >= $gross) {
            $this->status = self::STATUS_PAID;
            return;
        }

        // 2. Check for overdue (only for non-drafts)
        if ($this->status !== self::STATUS_DRAFT && $this->due_date) {
            $dueDate = \Illuminate\Support\Carbon::parse($this->due_date);
            if ($dueDate->isPast() && $this->status !== self::STATUS_PAID) {
                $this->status = self::STATUS_OVERDUE;
            }
        }
    }

    // ─── Serialization ───────────────────────────────────────────────

    protected $appends = ['amount_net_eur', 'amount_tax_eur', 'amount_gross_eur', 'shipping_eur', 'discount_eur', 'paid_amount_eur', 'amount_due_eur'];
}
