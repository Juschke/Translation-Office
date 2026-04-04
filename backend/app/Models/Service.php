<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'service_code',
        'unit',
        'base_price',
        'status',
        'is_extra',
    ];

    protected $casts = [
        'is_extra' => 'boolean',
        'base_price' => 'decimal:4',
    ];
}
