<?php

namespace App\Http\Middleware;

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
     * Log the request to database.
     */
    protected function logRequest(Request $request, Response $response, float $duration, int $memoryUsage, string $requestId): void
    {
        $user = $request->user();

        // Prepare request body (exclude sensitive data)
        $requestBody = $request->except(['password', 'password_confirmation', 'token', 'api_token']);

        // Prepare response body (limit size)
        $responseBody = null;
        if ($response->getContent()) {
            $content = $response->getContent();
            // Limit response body to 50KB to avoid DB bloat
            if (strlen($content) < 50000) {
                $responseBody = json_decode($content, true);
            } else {
                $responseBody = ['_truncated' => true, '_size' => strlen($content)];
            }
        }

        // Sanitize headers (remove sensitive data)
        $requestHeaders = $this->sanitizeHeaders($request->headers->all());
        $responseHeaders = $this->sanitizeHeaders($response->headers->all());

        ApiRequestLog::create([
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'endpoint' => $request->path(),
            'status_code' => $response->getStatusCode(),
            'query_params' => $request->query->all(),
            'request_body' => $requestBody,
            'request_headers' => $requestHeaders,
            'response_body' => $responseBody,
            'response_headers' => $responseHeaders,
            'duration_ms' => round($duration, 2),
            'memory_usage' => $memoryUsage,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->headers->get('referer'),
            'user_id' => $user?->id,
            'tenant_id' => $user?->tenant_id,
            'user_email' => $user?->email,
            'session_id' => $request->hasSession() ? $request->session()->getId() : null,
            'error_message' => $response->getStatusCode() >= 400 ? $this->getErrorMessage($response) : null,
        ]);
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

    /**
     * Sanitize headers to remove sensitive information.
     */
    protected function sanitizeHeaders(array $headers): array
    {
        $sensitiveHeaders = [
            'authorization',
            'cookie',
            'php-auth-pw',
            'x-csrf-token',
        ];

        foreach ($sensitiveHeaders as $header) {
            if (isset($headers[$header])) {
                $headers[$header] = ['***REDACTED***'];
            }
        }

        return $headers;
    }

    /**
     * Extract error message from response.
     */
    protected function getErrorMessage(Response $response): ?string
    {
        try {
            $content = json_decode($response->getContent(), true);
            return $content['message'] ?? $content['error'] ?? 'Unknown error';
        } catch (\Exception $e) {
            return null;
        }
    }
}
