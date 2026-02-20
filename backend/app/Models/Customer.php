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
        'payment_terms_days',
        'bank_account_holder',
        'iban',
        'bic',
        'bank_name',
        'bank_code',
        'tax_id',
        'vat_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'additional_emails' => 'array',
        'additional_phones' => 'array',
        'payment_terms_days' => 'integer',
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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (auth()->check()) {
                $customer->created_by = auth()->id();
                $customer->updated_by = auth()->id();
            }
        });

        static::updating(function ($customer) {
            if (auth()->check()) {
                $customer->updated_by = auth()->id();
            }
        });
    }
}
