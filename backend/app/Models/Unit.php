<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = ['name', 'abbreviation', 'status'];
}
