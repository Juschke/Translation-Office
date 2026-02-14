<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * InvoiceItem — Frozen line-item snapshot
 *
 * Represents a single line item on an invoice. These are frozen copies of
 * project positions at the time of invoice creation. They are never updated
 * after the invoice is issued (GoBD compliance).
 *
 * All monetary values are stored as INTEGER CENTS to avoid floating-point errors.
 */
class InvoiceItem extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'invoice_id',
        'position',
        'description',
        'quantity',
        'unit',              // words, lines, pages, hours, flat
        'unit_price_cents',  // Price per unit in cents
        'total_cents',       // Line total in cents
        'tax_rate',
    ];

    protected $casts = [
        'quantity'         => 'decimal:4',
        'unit_price_cents' => 'integer',
        'total_cents'      => 'integer',
        'tax_rate'         => 'decimal:2',
        'position'         => 'integer',
    ];

    /**
     * The supported unit types for the translation industry.
     */
    public const UNITS = [
        'words'  => 'Wörter',
        'lines'  => 'Normzeilen',
        'pages'  => 'Normseiten',
        'hours'  => 'Stunden',
        'flat'   => 'Pauschal',
    ];

    // ─── Cents → EUR Accessors ───────────────────────────────────────

    /**
     * Get unit price in EUR (e.g. 150 cents → 1.50 EUR)
     */
    public function getUnitPriceEurAttribute(): float
    {
        return $this->unit_price_cents / 100;
    }

    /**
     * Get line total in EUR
     */
    public function getTotalEurAttribute(): float
    {
        return $this->total_cents / 100;
    }

    // ─── Relationships ───────────────────────────────────────────────

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    // ─── Serialization ───────────────────────────────────────────────

    protected $appends = ['unit_price_eur', 'total_eur'];
}
