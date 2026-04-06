<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Mail\PortalMagicLinkMail;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PortalAuthController extends Controller
{
    public function requestMagicLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $customer = Customer::where('email', $request->email)
            ->where('portal_access', true)
            ->first();

        // Always return success to prevent email enumeration
        if (!$customer) {
            return response()->json(['message' => 'Falls ein Konto existiert, erhalten Sie einen Anmeldelink.']);
        }

        $token = Str::random(64);
        $customer->portal_token = hash('sha256', $token);
        $customer->portal_token_expires_at = Carbon::now()->addHours(24);
        $customer->save();

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $magicLink = $frontendUrl . '/portal/auth/verify/' . $token;

        $companyName = \App\Models\Tenant::where('id', $customer->tenant_id)->value('company_name') ?? 'Ihr Übersetzungsbüro';

        Mail::to($customer->email)->send(new PortalMagicLinkMail($customer, $magicLink, $companyName));

        return response()->json(['message' => 'Falls ein Konto existiert, erhalten Sie einen Anmeldelink.']);
    }

    public function verifyMagicLink(Request $request, string $token)
    {
        $hashed = hash('sha256', $token);

        $customer = Customer::where('portal_token', $hashed)
            ->where('portal_access', true)
            ->first();

        if (!$customer || !$customer->hasValidMagicLink($token)) {
            return response()->json(['message' => 'Link ungültig oder abgelaufen.'], 422);
        }

        $sessionToken = Str::random(64);
        $customer->portal_token = null;
        $customer->portal_token_expires_at = null;
        $customer->portal_session_token = hash('sha256', $sessionToken);
        $customer->portal_session_expires_at = Carbon::now()->addDays(7);
        $customer->portal_last_login_at = now();
        $customer->save();

        return response()->json([
            'token' => $sessionToken,
            'customer' => $this->customerData($customer),
        ]);
    }

    public function me(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        return response()->json($this->customerData($customer));
    }

    public function logout(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $customer->portal_session_token = null;
        $customer->portal_session_expires_at = null;
        $customer->save();
        return response()->json(['message' => 'Abgemeldet.']);
    }

    private function customerData(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'company_name' => $customer->company_name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'address_street' => $customer->address_street,
            'address_zip' => $customer->address_zip,
            'address_city' => $customer->address_city,
            'address_country' => $customer->address_country,
            'portal_last_login_at' => $customer->portal_last_login_at,
        ];
    }
}
