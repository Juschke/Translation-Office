<?php

namespace App\Http\Middleware;

use App\Jobs\LogApiRequest;
use App\Models\ApiRequestLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip logging for certain routes
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        // Generate unique request ID
        $requestId = Str::uuid()->toString();
        $request->attributes->set('request_id', $requestId);

        // Process the request
        $response = $next($request);

        // Debug authentication
        if (!$this->shouldSkip($request)) {
            \Illuminate\Support\Facades\Log::debug('Request Auth Status', [
                'user_id' => $request->user()?->id,
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'has_auth_header' => $request->hasHeader('Authorization'),
            ]);
        }

        // Calculate duration and memory
        $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
        $memoryUsage = memory_get_usage() - $startMemory;

        // Log the request asynchronously (in real app, use queue)
        try {
            $this->logRequest($request, $response, $duration, $memoryUsage, $requestId);
        } catch (\Exception $e) {
            // Don't let logging errors break the application
            \Log::error('Failed to log API request: ' . $e->getMessage());
        }

        return $response;
    }

    /**
     * Dispatch async job to log the request to database (non-blocking)
     */
    protected function logRequest(Request $request, Response $response, float $duration, int $memoryUsage, string $requestId): void
    {
        $user = $request->user();

        // Prepare request body (exclude sensitive data)
        $requestData = $request->except([
            'password', 'password_confirmation', 'current_password',
            'code', 'token', 'api_token', 'api_key', 'api_secret',
            'credit_card', 'cvv', 'iban', 'bic'
        ]);

        // ✅ Dispatch async job (non-blocking)
        LogApiRequest::dispatch(
            method: $request->method(),
            path: $request->path(),
            statusCode: $response->getStatusCode(),
            duration: $duration / 1000, // Convert ms to seconds
            memory: $memoryUsage,
            userId: $user?->id,
            ip: $request->ip(),
            requestData: $requestData,
            userAgent: $request->userAgent(),
        );

        // Log wird in LogApiRequest Job erstellt
    }

    /**
     * Check if request should be skipped from logging.
     */
    protected function shouldSkip(Request $request): bool
    {
        if ($request->isMethod('OPTIONS')) {
            return true;
        }

        $skipRoutes = [
            'sanctum/csrf-cookie',
            'admin/pulse',
            'admin/health',
            'admin/metrics',
            'admin/api-logs', // Don't log the logs viewing endpoint
        ];

        foreach ($skipRoutes as $route) {
            if (Str::contains($request->path(), $route)) {
                return true;
            }
        }

        return false;
    }

}
