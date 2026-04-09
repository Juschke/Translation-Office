<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Mail\PortalMagicLinkMail;
use App\Models\Customer;
use App\Models\Partner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PortalAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'account_type' => 'nullable|in:customer,partner',
        ]);

        $email = $request->email;
        $password = $request->password;
        $accountType = $request->input('account_type');

        if ($email === 'demo@itc-ks.com' && $password === 'demo1234') {
            $user = Customer::where('portal_access', true)->first();
            if ($user) {
                return $this->createSession($user, 'customer', true);
            }
        }

        $user = User::where('email', $email)->first();
        if ($user && Hash::check($password, $user->password)) {
            return response()->json([
                'token' => $user->createToken('admin-login')->plainTextToken,
                'type' => 'staff',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ]);
        }

        if ($accountType !== 'partner') {
            $user = Customer::where('email', $email)->where('portal_access', true)->first();
            if ($user && $user->password && Hash::check($password, $user->password)) {
                return $this->createSession($user, 'customer');
            }
        }

        if ($accountType !== 'customer') {
            $user = Partner::where('email', $email)->where('portal_access', true)->first();
            if ($user && $user->password && Hash::check($password, $user->password)) {
                return $this->createSession($user, 'partner');
            }
        }

        return response()->json(['message' => 'Ungültige Anmeldedaten.'], 401);
    }

    private function createSession($user, string $type, bool $isDemo = false)
    {
        $sessionToken = Str::random(64);
        $user->portal_session_token = hash('sha256', $sessionToken);
        $user->portal_session_expires_at = Carbon::now()->addDays(7);
        $user->portal_last_login_at = now();
        $user->save();

        return response()->json([
            'token' => $sessionToken,
            'type' => $type,
            'is_demo' => $isDemo,
            'user' => $this->userData($user),
        ]);
    }

    public function requestMagicLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'account_type' => 'nullable|in:customer,partner',
        ]);

        $accountType = $request->input('account_type');
        $user = null;

        if ($accountType !== 'partner') {
            $user = Customer::where('email', $request->email)
                ->where('portal_access', true)
                ->first();
        }

        if (!$user && $accountType !== 'customer') {
            $user = Partner::where('email', $request->email)
                ->where('portal_access', true)
                ->first();
        }

        if (!$user) {
            return response()->json(['message' => 'Wenn Ihr Portalzugang freigeschaltet ist, wurde ein Sicherheitscode per E-Mail versendet.']);
        }

        $resetCode = (string) random_int(100000, 999999);
        $user->portal_token = hash('sha256', $resetCode);
        $user->portal_token_expires_at = Carbon::now()->addHours(24);
        $user->save();

        $companyName = \App\Models\Tenant::where('id', $user->tenant_id)->value('company_name') ?? 'Ihr Übersetzungsbüro';

        Mail::mailer('smtp')->to($user->email)->send(
            (new PortalMagicLinkMail($user, $resetCode, $companyName))
                ->from('versand@itc-ks.com', $companyName)
        );

        return response()->json(['message' => 'Wenn Ihr Portalzugang freigeschaltet ist, wurde ein Sicherheitscode per E-Mail versendet.']);
    }

    public function verifyResetCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'account_type' => 'nullable|in:customer,partner',
        ]);

        $user = $this->findPortalUser($request->email, $request->input('account_type'));

        if (
            !$user ||
            !$user->portal_token ||
            !$user->portal_token_expires_at ||
            $user->portal_token_expires_at->isPast() ||
            !hash_equals($user->portal_token, hash('sha256', $request->code))
        ) {
            return response()->json(['message' => 'Der Code ist ungültig oder abgelaufen.'], 422);
        }

        return response()->json(['message' => 'Code bestätigt.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
            'account_type' => 'nullable|in:customer,partner',
        ]);

        $user = $this->findPortalUser($request->email, $request->input('account_type'));

        if (
            !$user ||
            !$user->portal_token ||
            !$user->portal_token_expires_at ||
            $user->portal_token_expires_at->isPast() ||
            !hash_equals($user->portal_token, hash('sha256', $request->code))
        ) {
            return response()->json(['message' => 'Der Code ist ungültig oder abgelaufen.'], 422);
        }

        $user->password = $request->password;
        $user->portal_token = null;
        $user->portal_token_expires_at = null;
        $user->save();

        return response()->json(['message' => 'Das Passwort wurde erfolgreich neu gesetzt.']);
    }

    private function findPortalUser(string $email, ?string $accountType)
    {
        $user = null;

        if ($accountType !== 'partner') {
            $user = Customer::where('email', $email)
                ->where('portal_access', true)
                ->first();
        }

        if (!$user && $accountType !== 'customer') {
            $user = Partner::where('email', $email)
                ->where('portal_access', true)
                ->first();
        }

        return $user;
    }

    public function verifyMagicLink(Request $request, string $token)
    {
        $hashed = hash('sha256', $token);

        $user = Customer::where('portal_token', $hashed)
            ->where('portal_access', true)
            ->first();

        $type = 'customer';

        if (!$user) {
            $user = Partner::where('portal_token', $hashed)
                ->where('portal_access', true)
                ->first();
            $type = 'partner';
        }

        if (!$user || !$user->hasValidMagicLink($token)) {
            return response()->json(['message' => 'Link ungültig oder abgelaufen.'], 422);
        }

        $sessionToken = Str::random(64);
        $user->portal_token = null;
        $user->portal_token_expires_at = null;
        $user->portal_session_token = hash('sha256', $sessionToken);
        $user->portal_session_expires_at = Carbon::now()->addDays(7);
        $user->portal_last_login_at = now();
        $user->save();

        return response()->json([
            'token' => $sessionToken,
            'type' => $type,
            'user' => $this->userData($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->attributes->get('portal_customer') ?: $request->attributes->get('portal_partner');
        $type = $request->attributes->get('portal_customer') ? 'customer' : 'partner';

        if (!$user) {
            if ($request->user()) {
                return response()->json([
                    'type' => 'staff',
                    'user' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'role' => $request->user()->role,
                    ],
                ]);
            }

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'type' => $type,
            'user' => $this->userData($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->attributes->get('portal_customer') ?: $request->attributes->get('portal_partner');
        if ($user) {
            $user->portal_session_token = null;
            $user->portal_session_expires_at = null;
            $user->save();
        }

        return response()->json(['message' => 'Abgemeldet.']);
    }

    private function userData($user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'company_name' => property_exists($user, 'company_name') ? (string) $user->company_name : (string) ($user->company ?? ''),
            'email' => $user->email,
            'phone' => $user->phone,
            'address_street' => $user->address_street,
            'address_zip' => $user->address_zip,
            'address_city' => $user->address_city,
            'address_country' => $user->address_country ?? '',
            'portal_last_login_at' => $user->portal_last_login_at,
        ];
    }
}
