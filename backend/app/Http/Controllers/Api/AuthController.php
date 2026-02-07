<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create user without tenant first
        // tenant_id will be null initially, which is allowed by migration
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'status' => 'active',
            'is_admin' => false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('tenant'),
            'message' => 'Registrierung erfolgreich! Bitte vervollständigen Sie Ihr Profil.',
        ], 201);
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Die Zugangsdaten sind nicht korrekt.'],
            ]);
        }

        // Two Factor Check
        if ($user->two_factor_confirmed_at) {
            if (!$request->has('code')) {
                return response()->json(['two_factor' => true]);
            }

            $google2fa = new \PragmaRX\Google2FA\Google2FA();
            $isValid = false;

            // Decrypt secret
            try {
                $secret = decrypt($user->two_factor_secret);
                $isValid = $google2fa->verifyKey($secret, $request->code);
            } catch (\Exception $e) {
                // Ignore decryption error, assume invalid
            }

            // Check Recovery Codes if TOTP invalid
            if (!$isValid) {
                $recoveryCodes = $user->two_factor_recovery_codes ? json_decode(decrypt($user->two_factor_recovery_codes), true) : [];
                if (in_array($request->code, $recoveryCodes)) {
                    $isValid = true;
                    // Remove used code
                    $recoveryCodes = array_values(array_diff($recoveryCodes, [$request->code]));
                    $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
                    $user->save();
                }
            }

            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => ['Der Sicherheitscode ist ungültig.'],
                ]);
            }
        }

        // Update last login timestamp
        $user->last_login_at = now();
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('tenant'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Abgemeldet']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('tenant'));
    }

    public function onboarding(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'legal_form' => 'nullable|string|max:100',
            'address_street' => 'nullable|string|max:255',
            'address_house_no' => 'nullable|string|max:20',
            'address_zip' => 'nullable|string|max:20',
            'address_city' => 'nullable|string|max:255',
            'address_country' => 'nullable|string|max:10',
            'bank_name' => 'nullable|string|max:255',
            'bank_iban' => 'nullable|string|max:50',
            'bank_bic' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:100',
            'vat_id' => 'nullable|string|max:100',
            'subscription_plan' => 'required|string|in:basic,pro,premium,enterprise',
            'license_key' => 'nullable|string|max:255',
            'invitations' => 'nullable|array',
            'invitations.*' => 'email'
        ]);

        $user = $request->user();

        $tenant = Tenant::create([
            'company_name' => $validated['company_name'] ?: ($user->name . 's Büro'),
            'legal_form' => $validated['legal_form'],
            'address_street' => $validated['address_street'],
            'address_house_no' => $validated['address_house_no'],
            'address_zip' => $validated['address_zip'],
            'address_city' => $validated['address_city'],
            'address_country' => $validated['address_country'] ?: 'DE',
            'bank_name' => $validated['bank_name'],
            'bank_iban' => $validated['bank_iban'],
            'bank_bic' => $validated['bank_bic'],
            'tax_number' => $validated['tax_number'],
            'vat_id' => $validated['vat_id'],
            'subscription_plan' => $validated['subscription_plan'],
            'license_key' => $validated['license_key'],
            'status' => 'active',
        ]);

        $user->tenant_id = $tenant->id;
        $user->save();

        // Process Invitations
        if (!empty($validated['invitations'])) {
            foreach ($validated['invitations'] as $email) {
                User::create([
                    'tenant_id' => $tenant->id,
                    'email' => $email,
                    'name' => 'Eingeladener Benutzer',
                    'password' => Hash::make(str()->random(16)),
                    'role' => 'user',
                ]);
                // TODO: Send actual invitation email
            }
        }

        return response()->json([
            'message' => 'Onboarding erfolgreich',
            'user' => $user->load('tenant'),
        ]);
    }
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => 'Profil erfolgreich aktualisiert',
            'user' => $user->load('tenant'),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Das aktuelle Passwort ist falsch.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Passwort erfolgreich geändert',
        ]);
    }
}
