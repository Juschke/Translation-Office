<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = ['name', 'description', 'status'];
}
