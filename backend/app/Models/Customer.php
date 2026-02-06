<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity;

    protected $fillable = [
        'type',
        'salutation',
        'first_name',
        'last_name',
        'company_name',
        'contact_person',
        'email',
        'additional_emails',
        'phone',
        'additional_phones',
        'address_street',
        'address_house_no',
        'address_zip',
        'address_city',
        'address_country',
        'price_matrix_id',
        'notes',
        'status',
        'leitweg_id',
        'legal_form',
    ];

    protected $casts = [
        'additional_emails' => 'array',
        'additional_phones' => 'array',
    ];

    public function priceMatrix()
    {
        return $this->belongsTo(PriceMatrix::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
