<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LogDataAccess
{
    /**
     * Handle an incoming request.
     * Logs access to sensitive personal data for GDPR/DSGVO compliance.
     */
    public function handle(Request $request, Closure $next, string $resourceType)
    {
        $response = $next($request);

        // Only log successful reads (GET)
        if ($request->isMethod('GET') && $response->getStatusCode() === 200) {
            $user = $request->user();

            activity()
                ->performedOn($this->getSubject($request, $resourceType))
                ->causedBy($user)
                ->withProperties([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'url' => $request->fullUrl(),
                    'resource' => $resourceType,
                    'action' => 'view_detail'
                ])
                ->log("DSGVO: Zugriff auf personenbezogene Daten ({$resourceType})");
        }

        return $response;
    }

    private function getSubject(Request $request, string $resourceType)
    {
        // Try to find the model instance from the route
        $parameters = $request->route()->parameters();
        return reset($parameters) ?: null;
    }
}
