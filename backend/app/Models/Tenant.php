<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'company_name',
        'legal_form',
        'domain',
        'address_street',
        'address_house_no',
        'address_zip',
        'address_city',
        'address_country',
        'tax_number',
        'vat_id',
        'bank_name',
        'bank_iban',
        'bank_bic',
        'subscription_plan',
        'license_key',
        'status'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function settings()
    {
        return $this->hasMany(TenantSetting::class);
    }
}
