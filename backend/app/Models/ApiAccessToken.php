<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken;

class ApiAccessToken extends PersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getTenantNameAttribute(): ?string
    {
        return $this->tokenable?->tenant?->company_name;
    }

    public function getTokenStatusAttribute(): string
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return 'expired';
        }

        if ($this->last_used_at && $this->last_used_at->gt(now()->subDays(7))) {
            return 'active';
        }

        return 'idle';
    }

    public function getAbilitiesLabelAttribute(): string
    {
        if (empty($this->abilities)) {
            return 'Standard';
        }

        if ($this->abilities === ['*']) {
            return 'Vollzugriff';
        }

        return implode(', ', $this->abilities);
    }
}
