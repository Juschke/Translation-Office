<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'iso_code',
        'name_internal',
        'name_native',
        'flag_icon',
        'is_source_allowed',
        'is_target_allowed',
        'status',
    ];

    protected $casts = [
        'is_source_allowed' => 'boolean',
        'is_target_allowed' => 'boolean',
    ];
}
