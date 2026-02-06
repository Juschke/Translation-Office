<?php

namespace App\Observers;

use App\Models\User;
use App\Models\TenantSetting;

class UserObserver
{
    /**
     * Handle the User "creating" event.
     */
    public function creating(User $user): void
    {
        if (empty($user->custom_id)) {
            $prefix = 'C-'; // Default for generic user if role unknown, but we usually know role

            // Determine role based on attributes or context if available.
            // Since role might be set on creation.
            if ($user->role === 'customer') {
                $prefix = TenantSetting::where('key', 'customer_id_prefix')->value('value') ?? 'K-';
            } elseif ($user->role === 'partner' || $user->role === 'translator') {
                // Assuming 'partner' or 'translator' is the role for partners
                $prefix = TenantSetting::where('key', 'partner_id_prefix')->value('value') ?? 'D-';
            }

            // Find max custom_id with this prefix to increment
            // This is a simple implementation, might need better locking for high concurrency
            // We use a simple numeric sequence.
            $latest = User::where('custom_id', 'like', "{$prefix}%")
                ->orderByRaw('LENGTH(custom_id) DESC')
                ->orderBy('custom_id', 'desc')
                ->first();

            $number = 1;
            if ($latest) {
                // Extract number
                $str = str_replace($prefix, '', $latest->custom_id);
                if (is_numeric($str)) {
                    $number = intval($str) + 1;
                }
            }

            $user->custom_id = $prefix . str_pad($number, 5, '0', STR_PAD_LEFT);
        }
    }
}
