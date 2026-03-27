<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = ['code', 'name', 'symbol', 'is_default', 'status'];

    protected $casts = ['is_default' => 'boolean'];
}
