<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity, \App\Traits\HasSequentialCode;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'subject',
        'body',
        'type',
        'status',
    ];
}
