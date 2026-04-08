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
        'mobile',
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
        'password',
        'portal_access',
        'portal_token',
        'portal_token_expires_at',
        'portal_session_token',
        'portal_session_expires_at',
        'portal_last_login_at',
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
        'password' => 'hashed',
        'portal_access' => 'boolean',
        'portal_token_expires_at' => 'datetime',
        'portal_session_expires_at' => 'datetime',
        'portal_last_login_at' => 'datetime',
    ];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function hasValidMagicLink(string $token): bool
    {
        if (!$this->portal_token || !$this->portal_token_expires_at) {
            return false;
        }

        if ($this->portal_token_expires_at->isPast()) {
            return false;
        }

        return hash_equals($this->portal_token, hash('sha256', $token));
    }
}
