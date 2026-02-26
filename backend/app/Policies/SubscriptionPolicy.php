<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * SubscriptionPolicy — Access Control for SaaS Subscriptions
 *
 * IMPORTANT: Subscriptions are ONLY managed by the software owner (is_admin = true).
 * Individual tenants can view their own subscription but cannot create/update/delete.
 */
class SubscriptionPolicy
{
    /**
     * Determine whether the user can view any models.
     * Software owner can see all, regular users can see their tenant's subscription.
     */
    public function viewAny(User $user): bool
    {
        // Software owner can view all subscriptions
        if ($user->is_admin) {
            return true;
        }

        // Regular users can view their own tenant's subscription
        return $user->tenant_id !== null;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Subscription $subscription): bool
    {
        // Software owner can view any subscription
        if ($user->is_admin) {
            return true;
        }

        // Regular users can only view their own tenant's subscription
        return $user->tenant_id === $subscription->tenant_id;
    }

    /**
     * Determine whether the user can create models.
     * ONLY software owner can create subscriptions.
     */
    public function create(User $user): bool
    {
        return $user->is_admin === true;
    }

    /**
     * Determine whether the user can update the model.
     * ONLY software owner can update subscriptions.
     */
    public function update(User $user, Subscription $subscription): bool
    {
        return $user->is_admin === true;
    }

    /**
     * Determine whether the user can delete the model.
     * ONLY software owner can delete subscriptions.
     */
    public function delete(User $user, Subscription $subscription): bool
    {
        return $user->is_admin === true;
    }

    /**
     * Determine whether the user can restore the model.
     * ONLY software owner can restore subscriptions.
     */
    public function restore(User $user, Subscription $subscription): bool
    {
        return $user->is_admin === true;
    }

    /**
     * Determine whether the user can permanently delete the model.
     * ONLY software owner can force delete subscriptions.
     */
    public function forceDelete(User $user, Subscription $subscription): bool
    {
        return $user->is_admin === true;
    }
}
