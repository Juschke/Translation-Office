<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    public function enable(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();

        // If already enabled/pending, reuse or regenerate? 
        // Let's regenerate to be safe/fresh.
        $secret = $google2fa->generateSecretKey();

        $recoveryCodes = Collection::times(8, function () {
            return Str::random(10) . '-' . Str::random(10);
        })->all();

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null // Pending confirmation
        ])->save();

        $otpUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'TranslationOffice'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'otpauth_url' => $otpUrl
        ]);
    }

    public function confirm(Request $request)
    {
        $request->validate(['code' => 'required|string']);
        $user = $request->user();

        if (!$user->two_factor_secret) {
            return response()->json(['message' => '2FA nicht initialisiert'], 400);
        }

        $google2fa = new Google2FA();
        $secret = decrypt($user->two_factor_secret);

        if ($google2fa->verifyKey($secret, $request->code)) {
            $user->forceFill([
                'two_factor_confirmed_at' => now()
            ])->save();

            return response()->json([
                'message' => '2FA erfolgreich aktiviert',
                'recovery_codes' => json_decode(decrypt($user->two_factor_recovery_codes))
            ]);
        }

        return response()->json(['message' => 'Ungültiger Code', 'errors' => ['code' => ['Ungültiger Code']]], 422);
    }

    public function disable(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Passwort falsch', 'errors' => ['password' => ['Passwort falsch']]], 422);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null
        ])->save();

        return response()->json(['message' => '2FA deaktiviert']);
    }

    public function getRecoveryCodes(Request $request)
    {
        $user = $request->user();
        if (!$user->two_factor_recovery_codes || !$user->two_factor_confirmed_at) {
            return response()->json([]);
        }

        return response()->json(json_decode(decrypt($user->two_factor_recovery_codes)));
    }

    public function regenerateRecoveryCodes(Request $request)
    {
        $user = $request->user();
        if (!$user->two_factor_confirmed_at)
            abort(400);

        $recoveryCodes = Collection::times(8, function () {
            return Str::random(10) . '-' . Str::random(10);
        })->all();

        $user->forceFill([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ])->save();

        return response()->json($recoveryCodes);
    }
}
