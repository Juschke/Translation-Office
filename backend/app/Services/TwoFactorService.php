<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class TwoFactorService
{
    /**
     * Generate hashed recovery codes for 2FA
     * Returns plaintext codes ONCE - user must save them
     */
    public function generateRecoveryCodes(User $user): array
    {
        $plainCodes = [];
        $hashedCodes = [];

        for ($i = 0; $i < 8; $i++) {
            $code = Str::random(4) . '-' . Str::random(4); // e.g., "ABCD-1234"
            $plainCodes[] = $code;

            $hashedCodes[] = [
                'code' => $code,
                'hash' => Hash::make($code),
                'used_at' => null,
            ];
        }

        // Store hashed codes
        $user->update([
            'two_factor_recovery_codes_hash' => json_encode($hashedCodes),
        ]);

        // Return plaintext codes ONCE
        return $plainCodes;
    }

    /**
     * Validate and use a recovery code
     * Marks code as used after validation
     */
    public function validateRecoveryCode(User $user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes_hash) {
            return false;
        }

        $codes = json_decode($user->two_factor_recovery_codes_hash, true) ?? [];

        foreach ($codes as &$record) {
            // Check hash and not yet used
            if (Hash::check($code, $record['hash']) && !$record['used_at']) {
                // Mark as used
                $record['used_at'] = now()->toDateTimeString();
                $user->update(['two_factor_recovery_codes_hash' => json_encode($codes)]);

                // Log the usage
                \Illuminate\Support\Facades\Log::info('2FA recovery code used', [
                    'user_id' => $user->id,
                ]);

                return true;
            }
        }

        return false;
    }

    /**
     * Get remaining recovery codes count
     */
    public function getRemainingRecoveryCodesCount(User $user): int
    {
        if (!$user->two_factor_recovery_codes_hash) {
            return 0;
        }

        $codes = json_decode($user->two_factor_recovery_codes_hash, true) ?? [];
        return count(array_filter($codes, fn($code) => !$code['used_at']));
    }

    /**
     * Check if user should regenerate recovery codes
     * Returns true if 2 or fewer codes remaining
     */
    public function shouldRegenerate(User $user): bool
    {
        return $this->getRemainingRecoveryCodesCount($user) <= 2;
    }
}
