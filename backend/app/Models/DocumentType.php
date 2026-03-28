<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'category',
        'code',
        'name',
        'default_price',
        'vat_rate',
        'template_file',
        'status',
    ];
}
