<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class EnsureTenantRole
{
    /**
     * Require a minimum tenant role level.
     *
     * Usage in routes:
     *   ->middleware('tenant.role:owner')    // only owners
     *   ->middleware('tenant.role:manager')  // owners + managers
     *   ->middleware('tenant.role:employee') // everyone (default)
     */
    public function handle(Request $request, Closure $next, string $minRole = User::ROLE_EMPLOYEE)
    {
        $user = $request->user();

        if (!$user || !$user->hasMinRole($minRole)) {
            abort(403, 'Keine Berechtigung. Erforderliche Rolle: ' . $minRole);
        }

        return $next($request);
    }
}
