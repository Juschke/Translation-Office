<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'tenant_id',
        'name',
        'unit',
        'base_price',
        'status',
    ];
}
