<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\BelongsToTenant, \App\Traits\LogsAllActivity, \App\Traits\HasDisplayId;

    protected $appends = ['display_id'];

    protected $fillable = [
        'custom_id',
        'type',
        'salutation',
        'first_name',
        'last_name',
        'company_name',
        'contact_person',
        'email',
        'additional_emails',
        'phone',
        'mobile',
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
        'portal_access',
        'portal_last_login_at',
        'password',
    ];

    protected $casts = [
        'additional_emails' => 'array',
        'additional_phones' => 'array',
        'payment_terms_days' => 'integer',
        'password' => 'hashed',
        'portal_access' => 'boolean',
        'portal_token_expires_at' => 'datetime',
        'portal_session_expires_at' => 'datetime',
        'portal_last_login_at' => 'datetime',
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

    public function isPortalSessionValid(): bool
    {
        return $this->portal_session_token &&
            $this->portal_session_expires_at &&
            $this->portal_session_expires_at->isFuture();
    }

    public function hasValidMagicLink(string $token): bool
    {
        return $this->portal_token &&
            $this->portal_token_expires_at &&
            $this->portal_token_expires_at->isFuture() &&
            hash_equals($this->portal_token, hash('sha256', $token));
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
