<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DunningSettings extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'enabled',
        'days_overdue', // JSON array
        'templates',    // JSON array of reminder texts
        'include_fees',
        'fee_per_level',
        'max_reminders',
        'stop_on_payment_plan',
    ];

    protected $casts = [
        'days_overdue' => 'array',
        'templates' => 'array',
        'enabled' => 'boolean',
        'include_fees' => 'boolean',
        'fee_per_level' => 'decimal:2',
        'max_reminders' => 'integer',
        'stop_on_payment_plan' => 'boolean',
    ];
}
