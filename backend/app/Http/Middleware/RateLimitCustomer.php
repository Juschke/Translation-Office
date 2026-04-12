<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate Limiting pro API Key oder Customer
 * Prüft Rate-Limits basierend auf API Key oder Tenant
 */
class RateLimitCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        // Versuche API-Key aus Header zu extrahieren
        $apiKey = $request->bearerToken();

        if ($apiKey) {
            return $this->limitByApiKey($apiKey, $request, $next);
        }

        // Fallback: Limit basierend auf Tenant (authenticated user)
        if (auth()->check()) {
            return $this->limitByTenant($request, $next);
        }

        return $next($request);
    }

    /**
     * Rate Limit für API Key
     */
    private function limitByApiKey(string $apiKey, Request $request, Closure $next): Response
    {
        $key = ApiKey::where('key', $apiKey)->first();

        if (!$key || !$key->isValid()) {
            return response()->json(['error' => 'Invalid or expired API key'], 401);
        }

        // Prüfe IP-Whitelist
        if ($key->ip_whitelist && !in_array($request->ip(), $key->ip_whitelist)) {
            Log::warning('API key request from unauthorized IP', [
                'key_id' => $key->id,
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'IP not whitelisted'], 403);
        }

        // Prüfe Rate Limit
        $cacheKey = "rate_limit:api_key:{$key->id}";
        $requestCount = (int)Cache::get($cacheKey, 0);

        if ($requestCount >= $key->rate_limit) {
            return response()->json(
                [
                    'error' => 'Rate limit exceeded',
                    'rate_limit' => $key->rate_limit,
                    'retry_after' => 60,
                ],
                429
            )->header('Retry-After', 60);
        }

        // Inkrementiere Counter
        Cache::increment($cacheKey);
        Cache::expire($cacheKey, 60); // Reset nach 1 Minute

        // Aktualisiere last_used_at
        $key->recordUsage();

        // Prüfe Scopes
        if (!$this->hasRequiredScope($key, $request)) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        $response = $next($request);

        // Rate-Limit Headers hinzufügen
        return $response
            ->header('X-Rate-Limit-Limit', $key->rate_limit)
            ->header('X-Rate-Limit-Remaining', $key->rate_limit - $requestCount - 1);
    }

    /**
     * Rate Limit für Tenant (authenticated user)
     */
    private function limitByTenant(Request $request, Closure $next): Response
    {
        $tenant = auth()->user()->tenant_id;
        $limit = 1000; // Default limit pro Minute

        // Prüfe ob Tenant ein Subscription-Limit hat
        $subscription = \App\Models\Subscription::where('tenant_id', $tenant)
            ->active()
            ->first();

        if ($subscription) {
            $limit = $subscription->plan->api_requests_per_minute ?? 1000;
        }

        $cacheKey = "rate_limit:tenant:{$tenant}";
        $requestCount = (int)Cache::get($cacheKey, 0);

        if ($requestCount >= $limit) {
            Log::warning('Tenant rate limit exceeded', [
                'tenant_id' => $tenant,
                'limit' => $limit,
            ]);

            return response()->json(
                [
                    'error' => 'Rate limit exceeded',
                    'rate_limit' => $limit,
                    'retry_after' => 60,
                ],
                429
            )->header('Retry-After', 60);
        }

        Cache::increment($cacheKey);
        Cache::expire($cacheKey, 60);

        $response = $next($request);

        return $response
            ->header('X-Rate-Limit-Limit', $limit)
            ->header('X-Rate-Limit-Remaining', $limit - $requestCount - 1);
    }

    /**
     * Prüfe ob API-Key den erforderlichen Scope hat
     */
    private function hasRequiredScope(ApiKey $key, Request $request): bool
    {
        // Route → benötigter Scope Mapping
        $scopeMap = [
            'invoices' => ['invoices:read', 'invoices:write'],
            'projects' => ['projects:read', 'projects:write'],
            'customers' => ['customers:read', 'customers:write'],
            'payments' => ['payments:read'],
            'reports' => ['reports:read'],
        ];

        foreach ($scopeMap as $resource => $scopes) {
            if (str_contains($request->path(), $resource)) {
                // Prüfe ob GET (read) oder POST/PUT/DELETE (write) erforderlich ist
                $requiredScope = $request->isMethodCacheable() ? $scopes[0] : ($scopes[1] ?? $scopes[0]);

                return in_array($requiredScope, $key->scopes ?? []);
            }
        }

        return true; // Kein spezifischer Scope erforderlich
    }
}
