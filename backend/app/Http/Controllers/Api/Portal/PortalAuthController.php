<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Mail\PortalMagicLinkMail;
use App\Models\Customer;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PortalAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $email = $request->email;
        $password = $request->password;

        // 1. Check for Demo Account
        if ($email === 'demo@itc-ks.com' && $password === 'demo1234') {
            $user = Customer::where('portal_access', true)->first();
            if ($user) {
                return $this->createSession($user, 'customer', true);
            }
        }

        // 2. Check internal Users (Managers/Staff)
        $user = User::where('email', $email)->first();
        if ($user && Hash::check($password, $user->password)) {
            // For staff, we might want a different session or just reuse the logic
            // But the Portal expectations are usually Customer/Partner models.
            // If a staff logs in, we might want to return 'type' => 'staff'
            // so the frontend can redirect to /dashboard instead of /portal
            return response()->json([
                'token' => $user->createToken('admin-login')->plainTextToken,
                'type' => 'staff',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ]);
        }

        // 3. Check Customers
        $user = Customer::where('email', $email)->where('portal_access', true)->first();
        if ($user && $user->password && Hash::check($password, $user->password)) {
            return $this->createSession($user, 'customer');
        }

        // 4. Check Partners
        $user = Partner::where('email', $email)->where('portal_access', true)->first();
        if ($user && $user->password && Hash::check($password, $user->password)) {
            return $this->createSession($user, 'partner');
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
        $request->validate(['email' => 'required|email']);

        $user = Customer::where('email', $request->email)
            ->where('portal_access', true)
            ->first();

        $type = 'customer';

        if (!$user) {
            $user = Partner::where('email', $request->email)
                ->where('portal_access', true)
                ->first();
            $type = 'partner';
        }

        // Always return success to prevent email enumeration
        if (!$user) {
            return response()->json(['message' => 'Falls ein Konto existiert, erhalten Sie einen Anmeldelink.']);
        }

        $token = Str::random(64);
        $user->portal_token = hash('sha256', $token);
        $user->portal_token_expires_at = Carbon::now()->addHours(24);
        $user->save();

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $magicLink = $frontendUrl . '/portal/verify/' . $token;

        $companyName = \App\Models\Tenant::where('id', $user->tenant_id)->value('company_name') ?? 'Ihr Übersetzungsbüro';

        Mail::mailer('smtp')->to($user->email)->send(
            (new PortalMagicLinkMail($user, $magicLink, $companyName))
                ->from('versand@itc-ks.com', $companyName)
        );

        return response()->json(['message' => 'Falls ein Konto existiert, erhalten Sie einen Anmeldelink.']);
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

        // Check if it's an internal user (staff) - though middleware usually prevents this from being null if protected
        if (!$user) {
            // If we are using Sanctum for staff, $request->user() might be populated
            if ($request->user()) {
                return response()->json([
                    'type' => 'staff',
                    'user' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'role' => $request->user()->role
                    ]
                ]);
            }
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'type' => $type,
            'user' => $this->userData($user)
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
