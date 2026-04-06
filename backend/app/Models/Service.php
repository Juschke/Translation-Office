<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity, \App\Traits\HasSequentialCode;

    protected $fillable = [
        'tenant_id',
        'name',
        'service_code',
        'unit',
        'base_price',
        'status',
    ];
}
