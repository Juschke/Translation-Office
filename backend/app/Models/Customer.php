<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'address_street',
        'address_zip',
        'address_city',
        'price_matrix_id',
    ];

    public function priceMatrix()
    {
        return $this->belongsTo(PriceMatrix::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
