<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'invoice_id',
        'tenant_id',
        'amount',
        'currency',
        'payment_method', // 'stripe', 'bank_transfer', 'cash'
        'stripe_intent_id',
        'stripe_charge_id',
        'status', // 'pending', 'completed', 'failed', 'refunded'
        'paid_at',
        'refunded_amount',
        'refunded_at',
        'metadata', // JSON für zusätzliche Daten
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
