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

            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
