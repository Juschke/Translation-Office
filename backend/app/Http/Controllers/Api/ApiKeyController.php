<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiKeyController
{
    /**
     * Liste alle API Keys für den aktuellen Tenant
     */
    public function index(): JsonResponse
    {
        $keys = ApiKey::where('tenant_id', auth()->user()->tenant_id)
            ->select(['id', 'name', 'key', 'scopes', 'rate_limit', 'last_used_at', 'expires_at', 'is_active'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($keys);
    }

    /**
     * Erstelle einen neuen API Key
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'scopes' => 'required|array|min:1',
            'scopes.*' => 'string|in:invoices:read,invoices:write,projects:read,projects:write,customers:read,customers:write,payments:read,reports:read',
            'rate_limit' => 'nullable|integer|min:100|max:10000',
            'ip_whitelist' => 'nullable|array',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $key = ApiKey::generate([
            'tenant_id' => auth()->user()->tenant_id,
            'name' => $request->name,
            'scopes' => $request->scopes,
            'rate_limit' => $request->rate_limit ?? 1000,
            'ip_whitelist' => $request->ip_whitelist,
            'expires_at' => $request->expires_at,
        ]);

        return response()->json([
            'id' => $key->id,
            'name' => $key->name,
            'key' => $key->key,
            'message' => 'API Key erstellt. Bitte kopiere den Key jetzt – er wird nicht erneut angezeigt!',
        ], 201);
    }

    /**
     * Zeige einen API Key (ohne Secret)
     */
    public function show(ApiKey $key): JsonResponse
    {
        $this->authorizeKey($key);

        return response()->json([
            'id' => $key->id,
            'name' => $key->name,
            'key' => $key->key,
            'scopes' => $key->scopes,
            'rate_limit' => $key->rate_limit,
            'ip_whitelist' => $key->ip_whitelist,
            'last_used_at' => $key->last_used_at,
            'expires_at' => $key->expires_at,
            'is_active' => $key->is_active,
            'is_expired' => $key->isExpired(),
            'created_at' => $key->created_at,
        ]);
    }

    /**
     * Aktualisiere einen API Key
     */
    public function update(Request $request, ApiKey $key): JsonResponse
    {
        $this->authorizeKey($key);

        $request->validate([
            'name' => 'nullable|string|max:255',
            'scopes' => 'nullable|array|min:1',
            'scopes.*' => 'string|in:invoices:read,invoices:write,projects:read,projects:write,customers:read,customers:write,payments:read,reports:read',
            'rate_limit' => 'nullable|integer|min:100|max:10000',
            'ip_whitelist' => 'nullable|array',
            'expires_at' => 'nullable|date|after:now',
            'is_active' => 'nullable|boolean',
        ]);

        $key->update($request->only('name', 'scopes', 'rate_limit', 'ip_whitelist', 'expires_at', 'is_active'));

        return response()->json($key->fresh());
    }

    /**
     * Lösche einen API Key
     */
    public function destroy(ApiKey $key): JsonResponse
    {
        $this->authorizeKey($key);

        $key->delete();

        return response()->json(['message' => 'API Key gelöscht']);
    }

    /**
     * Regeneriere den Secret eines Keys
     */
    public function regenerateSecret(Request $request, ApiKey $key): JsonResponse
    {
        $this->authorizeKey($key);

        $key->update(['secret' => hash('sha256', \Illuminate\Support\Str::random(64))]);

        return response()->json([
            'message' => 'Secret regeneriert',
        ]);
    }

    /**
     * Teste einen API Key
     */
    public function test(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
        ]);

        $key = ApiKey::where('key', $request->key)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$key || !$key->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired key'], 401);
        }

        // Prüfe IP-Whitelist
        if ($key->ip_whitelist && !in_array($request->ip(), $key->ip_whitelist)) {
            return response()->json(['valid' => false, 'message' => 'IP not whitelisted'], 403);
        }

        $key->recordUsage();

        return response()->json([
            'valid' => true,
            'scopes' => $key->scopes,
            'message' => 'API Key valid',
        ]);
    }

    // Helper
    private function authorizeKey(ApiKey $key): void
    {
        if ($key->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized');
        }
    }
}
