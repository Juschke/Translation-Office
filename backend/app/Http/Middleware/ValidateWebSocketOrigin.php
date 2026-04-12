<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validate WebSocket origin to prevent cross-origin WebSocket hijacking
 */
class ValidateWebSocketOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Skip validation if not a WebSocket upgrade request
        if (!$this->isWebSocketUpgrade($request)) {
            return $next($request);
        }

        $origin = $request->header('Origin') ?? $request->header('Referer');

        if (!$origin) {
            Log::warning('WebSocket request without Origin header', [
                'ip' => $request->ip(),
            ]);
            return response('Missing origin header', 403);
        }

        $allowedOrigins = config('reverb.apps.0.allowed_origins') ?? [];

        // Extract base origin (scheme + host)
        $originBase = parse_url($origin, PHP_URL_SCHEME) . '://' . parse_url($origin, PHP_URL_HOST);

        if (!in_array($originBase, $allowedOrigins)) {
            Log::warning('WebSocket origin not allowed', [
                'origin' => $origin,
                'ip' => $request->ip(),
                'allowed' => $allowedOrigins,
            ]);
            return response('Origin not allowed', 403);
        }

        return $next($request);
    }

    private function isWebSocketUpgrade(Request $request): bool
    {
        return strtolower($request->header('Upgrade') ?? '') === 'websocket' ||
               $request->path() === '/app' || // Reverb app endpoint
               str_starts_with($request->path(), '/app/');
    }
}
