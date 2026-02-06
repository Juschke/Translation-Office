<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'tenant_id',
        'name',
        'subject',
        'body',
        'type',
        'status',
    ];
}
