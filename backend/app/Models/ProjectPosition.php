<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPosition extends Model
{
    use \App\Traits\LogsAllActivity;
    protected $fillable = [
        'project_id',
        'description',
        'amount',
        'unit',
        'quantity',
        'partner_rate',
        'partner_mode',
        'partner_total',
        'customer_rate',
        'customer_mode',
        'customer_total',
        'tax_rate',
        'margin_type',
        'margin_percent',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'quantity' => 'decimal:2',
        'partner_rate' => 'decimal:2',
        'partner_total' => 'decimal:2',
        'customer_rate' => 'decimal:2',
        'customer_total' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'margin_percent' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
