<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\AsEncrypted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Webhook extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'url',
        'token',
        'events',
        'headers',
        'is_active',
        'last_triggered_at',
        'metadata',
    ];

    protected $casts = [
        'events' => 'array', // ['invoice.created', 'payment.completed', ...]
        'headers' => 'array', // Custom headers zu senden
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
        'metadata' => 'array',
        'token' => AsEncrypted::class,
    ];

    /**
     * Generiere Webhook-Token
     */
    public static function generate(array $attributes): self
    {
        return self::create(array_merge($attributes, [
            'token' => 'wh_' . Str::random(32),
        ]));
    }

    /**
     * Trigger ein Event
     */
    public function trigger(string $event, array $data): void
    {
        if (!$this->is_active || !in_array($event, $this->events ?? [])) {
            return;
        }

        \App\Jobs\TriggerWebhook::dispatch($this, $event, $data);
    }

    /**
     * Aktualisiere last_triggered_at
     */
    public function recordTrigger(): void
    {
        $this->update(['last_triggered_at' => now()]);
    }

    /**
     * Scope: nur aktive
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: mit bestimmtem Event
     */
    public function scopeForEvent($query, string $event)
    {
        return $query->whereJsonContains('events', $event);
    }
}
