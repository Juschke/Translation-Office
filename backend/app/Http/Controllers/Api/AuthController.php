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
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Auth\Events\Registered;
use Carbon\Carbon;
use App\Services\TwoFactorService;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'terms_accepted' => 'required|accepted',
            'privacy_accepted' => 'required|accepted',
        ]);

        // Create user without tenant first
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => User::ROLE_OWNER,
            'status' => 'pending', // Pending email verification
            'terms_accepted_at' => now(),
            'privacy_accepted_at' => now(),
        ]);

        // Trigger Laravel's built-in registration event (sends verification email)
        event(new Registered($user));

        // Create tokens with expiration
        $accessToken = $user->createToken('access', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message' => 'Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse und vervollständigen Sie Ihr Profil.',
            'user' => $user->load('tenant'),
        ], 201)
        ->cookie(
            name: 'access_token',
            value: $accessToken,
            minutes: 60, // 1 hour
            path: '/',
            domain: $this->getCookieDomain(),
            secure: $this->isSecureCookie(),
            httpOnly: true,
            sameSite: 'strict'
        )
        ->cookie(
            name: 'refresh_token',
            value: $refreshToken,
            minutes: 10080, // 7 days
            path: '/api/auth/refresh',
            domain: $this->getCookieDomain(),
            secure: $this->isSecureCookie(),
            httpOnly: true,
            sameSite: 'strict'
        );
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

            // Check Recovery Codes if TOTP invalid (use hashed recovery codes)
            if (!$isValid) {
                $twoFactorService = new TwoFactorService();
                if ($twoFactorService->validateRecoveryCode($user, $request->code)) {
                    $isValid = true;

                    // Notify user if running out of recovery codes
                    if ($twoFactorService->shouldRegenerate($user)) {
                        \Illuminate\Support\Facades\Log::warning('User should regenerate recovery codes', [
                            'user_id' => $user->id,
                            'remaining' => $twoFactorService->getRemainingRecoveryCodesCount($user),
                        ]);
                    }
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

        // Create tokens with expiration (HttpOnly Cookie friendly)
        $accessToken = $user->createToken('access', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message' => 'Erfolgreich angemeldet',
            'user' => $user->load('tenant'),
        ])
        ->cookie(
            name: 'access_token',
            value: $accessToken,
            minutes: 60, // 1 hour
            path: '/',
            domain: $this->getCookieDomain(),
            secure: $this->isSecureCookie(),
            httpOnly: true,
            sameSite: 'strict'
        )
        ->cookie(
            name: 'refresh_token',
            value: $refreshToken,
            minutes: 10080, // 7 days
            path: '/api/auth/refresh',
            domain: $this->getCookieDomain(),
            secure: $this->isSecureCookie(),
            httpOnly: true,
            sameSite: 'strict'
        );
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Abgemeldet'])
            ->cookie('access_token', '', -1)
            ->cookie('refresh_token', '', -1);
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    public function refresh(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Revoke old tokens (security: prevent token reuse)
        $user->tokens()->delete();

        // Generate new tokens
        $accessToken = $user->createToken('access', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json(['message' => 'Token refreshed'])
            ->cookie(
                name: 'access_token',
                value: $accessToken,
                minutes: 60,
                path: '/',
                domain: $this->getCookieDomain(),
                secure: $this->isSecureCookie(),
                httpOnly: true,
                sameSite: 'strict'
            )
            ->cookie(
                name: 'refresh_token',
                value: $refreshToken,
                minutes: 10080,
                path: '/api/auth/refresh',
                domain: $this->getCookieDomain(),
                secure: $this->isSecureCookie(),
                httpOnly: true,
                sameSite: 'strict'
            );
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
            'industry' => 'nullable|string|max:100',
            'managing_director' => 'nullable|string|max:255',
            'address_street' => 'nullable|string|max:255',
            'address_house_no' => 'nullable|string|max:20',
            'address_zip' => 'nullable|string|max:20',
            'address_city' => 'nullable|string|max:255',
            'address_country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
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
            'name' => $validated['company_name'] ?: ($user->name . 's Büro'),
            'company_name' => $validated['company_name'] ?: ($user->name . 's Büro'),
            'legal_form' => $validated['legal_form'] ?? null,
            'industry' => $validated['industry'] ?? null,
            'managing_director' => $validated['managing_director'] ?? null,
            'address_street' => $validated['address_street'] ?? null,
            'address_house_no' => $validated['address_house_no'] ?? null,
            'address_zip' => $validated['address_zip'] ?? null,
            'address_city' => $validated['address_city'] ?? null,
            'address_country' => $validated['address_country'] ?: 'Deutschland',
            'phone' => $validated['phone'] ?? null,
            'mobile' => $validated['mobile'] ?? null,
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
            'password' => [
                'required',
                'string',
                'confirmed',
                'different:current_password',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
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
            'password' => [
                'required',
                'min:8',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);

        // Find the password reset token with expiration check
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', hash('sha256', $request->token))
            ->where('expires_at', '>', now()) // ✅ Check expiration!
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'
            ], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Benutzer nicht gefunden.'], 404);
        }

        $user->forceFill([
            'password' => Hash::make($request->password)
        ]);
        $user->setRememberToken(Str::random(60));
        $user->save();

        // Delete token after use
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        // Revoke all tokens after reset
        $user->tokens()->delete();

        event(new PasswordReset($user));

        return response()->json(['message' => 'Ihr Passwort wurde erfolgreich zurückgesetzt.']);
    }

    /**
     * Get cookie domain based on environment
     */
    private function getCookieDomain(): ?string
    {
        if (config('app.env') === 'local') {
            return null; // localhost doesn't need domain
        }

        $url = parse_url(config('app.url'));
        return $url['host'] ?? null;
    }

    /**
     * Check if cookies should be secure (HTTPS only)
     */
    private function isSecureCookie(): bool
    {
        return config('app.env') === 'production' ||
               str_starts_with(config('app.url'), 'https');
    }
}
