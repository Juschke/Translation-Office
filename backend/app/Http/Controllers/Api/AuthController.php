<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

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
            'role' => User::ROLE_OWNER,
            'status' => 'active',
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
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'code' => 'nullable|string',
        ]);

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
            'address_country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|string|email|max:255',
            'website' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_iban' => 'nullable|string|max:50',
            'bank_bic' => 'nullable|string|max:20',
            'bank_account_holder' => 'nullable|string|max:255',
            'bank_code' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:100',
            'tax_office' => 'nullable|string|max:255',
            'vat_id' => 'nullable|string|max:100',
            'opening_hours' => 'nullable|string|max:255',
            'subscription_plan' => 'required|string',
            'license_key' => 'nullable|string|max:255',
            'invitations' => 'nullable|string', // JSON string from FormData
            'logo' => 'nullable|file|image|max:4096'
        ]);

        $user = $request->user();

        $tenantData = [
            'company_name' => $validated['company_name'] ?: ($user->name . 's Büro'),
            'legal_form' => $validated['legal_form'] ?? null,
            'address_street' => $validated['address_street'] ?? null,
            'address_house_no' => $validated['address_house_no'] ?? null,
            'address_zip' => $validated['address_zip'] ?? null,
            'address_city' => $validated['address_city'] ?? null,
            'address_country' => $validated['address_country'] ?: 'Deutschland',
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'website' => $validated['website'] ?? null,
            'opening_hours' => $validated['opening_hours'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_iban' => $validated['bank_iban'] ?? null,
            'bank_bic' => $validated['bank_bic'] ?? null,
            'bank_account_holder' => $validated['bank_account_holder'] ?? null,
            'bank_code' => $validated['bank_code'] ?? null,
            'tax_number' => $validated['tax_number'] ?? null,
            'tax_office' => $validated['tax_office'] ?? null,
            'vat_id' => $validated['vat_id'] ?? null,
            'subscription_plan' => $validated['subscription_plan'],
            'license_key' => $validated['license_key'] ?? null,
            'status' => 'active',
        ];

        $tenant = Tenant::create($tenantData);

        // Handle settings & logo
        $settings = [];
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('tenant_logos', 'public');
            $settings['company_logo'] = $path;
        }

        if (!empty($settings)) {
            $tenant->settings = $settings;
            $tenant->save();
        }

        $user->tenant_id = $tenant->id;
        $user->save();

        // Seed master data for the new tenant
        (new \Database\Seeders\MasterDataSeeder())->seedForTenant($tenant->id);

        // Process Invitations
        $invitations = isset($validated['invitations']) ? json_decode($validated['invitations'], true) : [];
        if (!empty($invitations) && is_array($invitations)) {
            foreach ($invitations as $email) {
                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    User::create([
                        'tenant_id' => $tenant->id,
                        'email' => $email,
                        'name' => 'Eingeladener Benutzer',
                        'password' => Hash::make(str()->random(16)),
                        'role' => User::ROLE_EMPLOYEE,
                    ]);
                    // TODO: Send actual invitation email
                }
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
            'password' => 'required|string|min:8|confirmed|different:current_password',
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

        // Revoke all other tokens for security (optional but recommended)
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json([
            'message' => 'Passwort erfolgreich geändert',
        ]);
    }

    public function updateLocale(Request $request)
    {
        $validated = $request->validate([
            'locale' => 'required|string|in:de,en',
        ]);

        $user = $request->user();
        $user->update(['locale' => $validated['locale']]);

        return response()->json([
            'message' => 'Sprache aktualisiert',
            'locale' => $user->locale,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // We use a custom response to avoid disclosing if email exists
        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts per E-Mail gesendet.'])
            : response()->json(['message' => 'E-Mail konnte nicht gesendet werden.'], 400);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60))->save();

                event(new PasswordReset($user));
                
                // Revoke all tokens after reset
                $user->tokens()->delete();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Ihr Passwort wurde erfolgreich zurückgesetzt.'])
            : response()->json(['message' => 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'], 400);
    }
}
