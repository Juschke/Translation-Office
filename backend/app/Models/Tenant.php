<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'legal_form',
        'domain',
        'address_street',
        'address_house_no',
        'address_zip',
        'address_city',
        'address_country',
        'phone',
        'email',
        'opening_hours',
        'tax_number',
        'vat_id',
        'bank_name',
        'bank_iban',
        'bank_bic',
        'bank_code',
        'bank_account_holder',
        'tax_office',
        'subscription_plan',
        'license_key',
        'status',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function partners()
    {
        return $this->hasMany(Partner::class);
    }

    public function settings()
    {
        return $this->hasMany(TenantSetting::class);
    }
}
