<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Subscription — SaaS Subscription Management
 *
 * KEY DESIGN DECISIONS:
 * 1. All monetary amounts stored as INTEGER CENTS (e.g. 9900 = 99,00 €)
 * 2. Each tenant has one active subscription (enforced at application level)
 * 3. Supports trial periods, auto-renewal, and payment provider integration
 */
class Subscription extends Model
{
    use \App\Traits\LogsAllActivity, SoftDeletes;

    // ─── Subscription Plans ──────────────────────────────────────────
    public const PLAN_FREE = 'free';
    public const PLAN_STARTER = 'starter';
    public const PLAN_PROFESSIONAL = 'professional';
    public const PLAN_ENTERPRISE = 'enterprise';

    // ─── Billing Cycles ──────────────────────────────────────────────
    public const CYCLE_MONTHLY = 'monthly';
    public const CYCLE_YEARLY = 'yearly';

    // ─── Subscription Status ─────────────────────────────────────────
    public const STATUS_ACTIVE = 'active';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_TRIAL = 'trial';

    // ─── Payment Providers ───────────────────────────────────────────
    public const PROVIDER_STRIPE = 'stripe';
    public const PROVIDER_PAYPAL = 'paypal';
    public const PROVIDER_SEPA = 'sepa';
    public const PROVIDER_INVOICE = 'invoice';

    protected $fillable = [
        'plan',
        'billing_cycle',
        'status',

        // Pricing in CENTS (integer)
        'price_net_cents',
        'price_gross_cents',
        'vat_rate_percent',

        // Trial period
        'is_trial',
        'trial_ends_at',

        // Subscription period
        'started_at',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
        'expires_at',

        // Plan limits
        'max_users',
        'max_projects',
        'max_storage_gb',

        // Payment provider
        'payment_provider',
        'payment_provider_subscription_id',
        'payment_provider_customer_id',

        // Billing contact
        'billing_email',
        'billing_address',

        // Auto-renewal
        'auto_renew',

        // Notes
        'notes',
    ];

    protected $casts = [
        'price_net_cents' => 'integer',
        'price_gross_cents' => 'integer',
        'vat_rate_percent' => 'decimal:2',
        'is_trial' => 'boolean',
        'trial_ends_at' => 'datetime',
        'started_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
        'max_users' => 'integer',
        'max_projects' => 'integer',
        'max_storage_gb' => 'integer',
        'auto_renew' => 'boolean',
    ];

    // ─── Cents → EUR Accessors ───────────────────────────────────────

    public function getPriceNetEurAttribute(): float
    {
        return $this->price_net_cents / 100;
    }

    public function getPriceGrossEurAttribute(): float
    {
        return $this->price_gross_cents / 100;
    }

    // ─── Relationships ───────────────────────────────────────────────

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // ─── Helper Methods ──────────────────────────────────────────────

    /**
     * Check if subscription is currently active (including trial).
     */
    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_ACTIVE, self::STATUS_TRIAL]);
    }

    /**
     * Check if subscription is in trial period.
     */
    public function onTrial(): bool
    {
        return $this->is_trial &&
               $this->trial_ends_at &&
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if trial has ended.
     */
    public function trialEnded(): bool
    {
        return $this->is_trial &&
               $this->trial_ends_at &&
               $this->trial_ends_at->isPast();
    }

    /**
     * Check if subscription can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_ACTIVE, self::STATUS_TRIAL]);
    }

    /**
     * Check if subscription has expired.
     */
    public function hasExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if subscription is within current billing period.
     */
    public function withinCurrentPeriod(): bool
    {
        $now = now();
        return $this->current_period_start <= $now && $this->current_period_end >= $now;
    }

    /**
     * Get days remaining in trial.
     */
    public function trialDaysRemaining(): int
    {
        if (!$this->onTrial()) {
            return 0;
        }

        return max(0, now()->diffInDays($this->trial_ends_at, false));
    }

    /**
     * Get days remaining in current period.
     */
    public function periodDaysRemaining(): int
    {
        if (!$this->current_period_end) {
            return 0;
        }

        return max(0, now()->diffInDays($this->current_period_end, false));
    }

    /**
     * Check if the tenant has reached user limit.
     */
    public function hasReachedUserLimit(): bool
    {
        if ($this->max_users === null) {
            return false; // Unlimited
        }

        return $this->tenant->users()->count() >= $this->max_users;
    }

    /**
     * Check if the tenant has reached project limit.
     */
    public function hasReachedProjectLimit(): bool
    {
        if ($this->max_projects === null) {
            return false; // Unlimited
        }

        return $this->tenant->projects()->count() >= $this->max_projects;
    }

    /**
     * Cancel the subscription (mark for non-renewal).
     */
    public function cancel(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'auto_renew' => false,
        ]);
    }

    /**
     * Resume a cancelled subscription.
     */
    public function resume(): void
    {
        if ($this->status === self::STATUS_CANCELLED && !$this->hasExpired()) {
            $this->update([
                'status' => self::STATUS_ACTIVE,
                'cancelled_at' => null,
                'auto_renew' => true,
            ]);
        }
    }

    // ─── Serialization ───────────────────────────────────────────────

    protected $appends = ['price_net_eur', 'price_gross_eur'];
}
