<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectStatus extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasSequentialCode;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'label',
        'color',
        'style',
        'sort_order',
        'is_active',
    ];
}
