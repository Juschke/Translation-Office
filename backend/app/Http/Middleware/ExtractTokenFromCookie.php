<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExtractTokenFromCookie
{
    /**
     * Handle an incoming request.
     *
     * Extract access token from HttpOnly cookie and add to Authorization header
     * This allows Sanctum to authenticate the request via Bearer token
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If Authorization header not present, try to get from cookie
        if (!$request->hasHeader('Authorization') && $request->hasCookie('access_token')) {
            $token = $request->cookie('access_token');
            
            // Log for debugging
            \Illuminate\Support\Facades\Log::debug('Extracting token from cookie', [
                'has_token' => !empty($token),
                'prefix' => substr($token, 0, 10)
            ]);

            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
                \Illuminate\Support\Facades\Log::debug('Authorization header set', ['header' => substr($request->header('Authorization'), 0, 15) . '...']);
            }
        }

        return $next($request);
    }
}
