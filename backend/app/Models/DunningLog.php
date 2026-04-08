<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DunningLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'invoice_id',
        'level',
        'fee_cents',
        'sent_at',
        'sent_by_user_id',
        'pdf_path',
        'notes',
    ];

    protected $casts = [
        'level'     => 'integer',
        'fee_cents' => 'integer',
        'sent_at'   => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function sentBy()
    {
        return $this->belongsTo(User::class, 'sent_by_user_id');
    }

    public function getLevelLabelAttribute(): string
    {
        return match ($this->level) {
            1 => 'Zahlungserinnerung',
            2 => '1. Mahnung',
            3 => '2. Mahnung',
            default => "Mahnstufe {$this->level}",
        };
    }

    public function getFeeCentsEurAttribute(): float
    {
        return $this->fee_cents / 100;
    }
}
