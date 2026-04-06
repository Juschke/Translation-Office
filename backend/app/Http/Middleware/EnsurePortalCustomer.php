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

        if (!$customer) {
            return response()->json(['message' => 'Sitzung abgelaufen oder ungültig.'], 401);
        }

        $request->attributes->set('portal_customer', $customer);
        return $next($request);
    }
}
