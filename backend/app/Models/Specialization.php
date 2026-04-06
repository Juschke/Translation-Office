<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\HasSequentialCode;

    protected $fillable = ['tenant_id', 'code', 'name', 'description', 'status'];
}
