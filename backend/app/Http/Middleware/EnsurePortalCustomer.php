<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use Closure;
use Illuminate\Http\Request;

class EnsurePortalCustomer
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Nicht authentifiziert.'], 401);
        }

        $hashed = hash('sha256', $token);

        $customer = Customer::where('portal_session_token', $hashed)
            ->where('portal_session_expires_at', '>', now())
            ->where('portal_access', true)
            ->first();

        if ($customer) {
            $request->attributes->set('portal_customer', $customer);
            return $next($request);
        }

        $partner = \App\Models\Partner::where('portal_session_token', $hashed)
            ->where('portal_session_expires_at', '>', now())
            ->where('portal_access', true)
            ->first();

        if ($partner) {
            $request->attributes->set('portal_partner', $partner);
            return $next($request);
        }

        // 3. Check for internal Staff (Sanctum)
        $staff = auth('sanctum')->user();
        if ($staff) {
            // If a staff is viewing the portal, we can treat them as a "Super User" 
            // but PortalController needs a portal_customer reference to show anything.
            // For now, we'll let them through, but they might see empty dashboard if no customer is "selected"
            // In many cases, staff might want to "Login as" customer.
            $request->attributes->set('portal_staff', $staff);
            return $next($request);
        }

        return response()->json(['message' => 'Sitzung abgelaufen oder ungültig.'], 401);
    }
}
