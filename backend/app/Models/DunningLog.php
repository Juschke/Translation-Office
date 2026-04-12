<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DunningLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'invoice_id',
        'tenant_id',
        'reminder_level',
        'outstanding_amount',
        'sent_at',
        'status',
        'pdf_path',
        'pdf_hash',
        'notes',
    ];

    protected $casts = [
        'outstanding_amount' => 'decimal:2',
        'sent_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Scope: nur versendete Mahnungen
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope: für spezifische Mahnstufe
     */
    public function scopeLevel($query, int $level)
    {
        return $query->where('reminder_level', $level);
    }
}
