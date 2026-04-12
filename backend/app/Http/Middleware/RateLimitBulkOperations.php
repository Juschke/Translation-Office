<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate limit bulk operations to prevent abuse
 */
class RateLimitBulkOperations
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->isBulkOperation($request)) {
            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Rate limit: 10 bulk operations per minute per user
        $limiter = app(RateLimiter::class);
        $key = "bulk-ops:" . $user->id;

        if ($limiter->tooManyAttempts($key, 10)) {
            $seconds = $limiter->availableIn($key);
            return response()->json([
                'message' => 'Zu viele Massenoperationen. Bitte versuchen Sie es in ' . $seconds . ' Sekunden erneut.',
                'retry_after' => $seconds,
            ], 429);
        }

        // Check item count
        $itemCount = count($request->input('ids', []));
        if ($itemCount > 100) {
            return response()->json([
                'message' => 'Maximal 100 Elemente pro Operation',
                'max_items' => 100,
                'provided' => $itemCount,
            ], 422);
        }

        // Log bulk operation
        \Illuminate\Support\Facades\Log::info('Bulk operation performed', [
            'user_id' => $user->id,
            'operation' => $request->path(),
            'item_count' => $itemCount,
        ]);

        $limiter->hit($key, 60); // Reset after 1 minute

        return $next($request);
    }

    private function isBulkOperation(Request $request): bool
    {
        $bulkPaths = [
            'api/projects/bulk-delete',
            'api/invoices/bulk-delete',
            'api/customers/bulk-delete',
            'api/partners/bulk-delete',
            'api/projects/bulk-update',
            'api/invoices/bulk-update',
            'api/customers/bulk-update',
            'api/partners/bulk-update',
        ];

        return in_array($request->path(), $bulkPaths);
    }
}
