<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;
use App\Traits\LogsAllActivity;

class ExternalCost extends Model
{
    use BelongsToTenant, LogsAllActivity;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'description',
        'cost_type',
        'amount_cents',
        'date',
        'supplier',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'amount_cents' => 'integer',
    ];

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Accessor: Convert cents to decimal for display
    public function getAmountAttribute(): float
    {
        return $this->amount_cents / 100;
    }

    // Mutator: Convert decimal to cents for storage
    public function setAmountAttribute($value): void
    {
        $this->attributes['amount_cents'] = (int) round($value * 100);
    }
}
