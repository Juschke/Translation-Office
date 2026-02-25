<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity, \App\Traits\HasDisplayId;

    protected $appends = ['display_id'];

    protected $fillable = [
        'type',
        'salutation',
        'first_name',
        'last_name',
        'company',
        'email',
        'additional_emails',
        'phone',
        'additional_phones',
        'languages',
        'domains',
        'software',
        'address_street',
        'address_house_no',
        'address_zip',
        'address_city',
        'bank_name',
        'bic',
        'iban',
        'tax_id',
        'payment_terms',
        'price_mode',
        'unit_rates',
        'flat_rates',
        'status',
        'rating',
        'notes',
    ];

    protected $casts = [
        'additional_emails' => 'array',
        'additional_phones' => 'array',
        'languages' => 'array',
        'domains' => 'array',
        'unit_rates' => 'array',
        'flat_rates' => 'array',
        'rating' => 'integer',
        'payment_terms' => 'integer',
    ];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
