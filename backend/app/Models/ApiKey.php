<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\AsEncrypted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'key',
        'secret',
        'scopes',
        'rate_limit',
        'ip_whitelist',
        'last_used_at',
        'expires_at',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'scopes' => 'array',
        'ip_whitelist' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'secret' => AsEncrypted::class, // Verschlüsselt speichern
    ];

    protected $hidden = ['secret'];

    /**
     * Generiere neuen API Key
     */
    public static function generate(array $attributes): self
    {
        $key = self::class;
        $secret = self::class;

        return self::create(array_merge($attributes, [
            'key' => 'sk_' . Str::random(32),
            'secret' => hash('sha256', Str::random(64)),
        ]));
    }

    /**
     * Validiere Secret-Hash
     */
    public function validateSecret(string $secret): bool
    {
        return $this->secret === hash('sha256', $secret);
    }

    /**
     * Prüfe ob Key abgelaufen ist
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Prüfe ob Key aktiv und gültig ist
     */
    public function isValid(): bool
    {
        return $this->is_active && !$this->isExpired();
    }

    /**
     * Aktualisiere last_used_at
     */
    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Scope: nur aktive Keys
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope: mit bestimmtem Scope
     */
    public function scopeWithScope($query, string $scope)
    {
        return $query->whereJsonContains('scopes', $scope);
    }
}
