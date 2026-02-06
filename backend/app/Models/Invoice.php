<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'invoice_number',
        'project_id',
        'customer_id',
        'date',
        'due_date',
        'amount_net',
        'tax_rate',
        'amount_tax',
        'amount_gross',
        'currency',
        'payment_method',
        'delivery_date',
        'service_period_start',
        'service_period_end',
        'status',
        'pdf_path',
    ];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'delivery_date' => 'date',
        'service_period_start' => 'date',
        'service_period_end' => 'date',
        'amount_net' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'amount_tax' => 'decimal:2',
        'amount_gross' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
