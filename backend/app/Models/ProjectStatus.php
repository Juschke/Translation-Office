<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectStatus extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'label',
        'color',
        'style',
        'sort_order',
        'is_active',
    ];
}
