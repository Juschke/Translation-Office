<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'invoice_number',
        'amount',
        'currency',
        'status',
        'invoice_date',
        'due_date',
        'pdf_url'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
