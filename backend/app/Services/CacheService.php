<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Closure;

/**
 * Centralized caching service for TMS
 * Handles all application caching with consistent key prefixes
 */
class CacheService
{
    // Cache TTLs (in minutes)
    const TTL_SHORT = 5;      // 5 minutes - frequently changing data
    const TTL_MEDIUM = 30;    // 30 minutes - semi-static data
    const TTL_LONG = 1440;    // 24 hours - static reference data
    const TTL_FOREVER = null; // No expiration

    /**
     * Cache report data (revenue, profit, taxes)
     */
    public static function cacheReportData(int $tenantId, string $reportType, string $period, Closure $callback): mixed
    {
        $key = "report:{$reportType}:{$tenantId}:{$period}";
        return Cache::remember($key, self::TTL_SHORT, $callback);
    }

    /**
     * Cache customer list for tenant
     */
    public static function cacheCustomerList(int $tenantId, ?string $filters = null, Closure $callback): mixed
    {
        $key = "customers:{$tenantId}:" . md5($filters ?? '');
        return Cache::remember($key, self::TTL_MEDIUM, $callback);
    }

    /**
     * Cache partner list for tenant
     */
    public static function cachePartnerList(int $tenantId, Closure $callback): mixed
    {
        $key = "partners:{$tenantId}";
        return Cache::remember($key, self::TTL_MEDIUM, $callback);
    }

    /**
     * Cache price matrices for tenant
     */
    public static function cachePriceMatrices(int $tenantId, Closure $callback): mixed
    {
        $key = "price_matrices:{$tenantId}";
        return Cache::remember($key, self::TTL_LONG, $callback);
    }

    /**
     * Cache master data (languages, currencies, services)
     */
    public static function cacheMasterData(string $type, int $tenantId, Closure $callback): mixed
    {
        $key = "master_data:{$type}:{$tenantId}";
        return Cache::remember($key, self::TTL_LONG, $callback);
    }

    /**
     * Invalidate tenant-specific caches
     */
    public static function invalidateTenantCache(int $tenantId): void
    {
        // Invalidate all caches with this tenant ID
        $keys = [
            "report:*:{$tenantId}:*",
            "customers:{$tenantId}:*",
            "partners:{$tenantId}",
            "price_matrices:{$tenantId}",
            "master_data:*:{$tenantId}",
            "tenant:{$tenantId}:*",
        ];

        foreach ($keys as $pattern) {
            // Note: Redis Wildcard deletion might not work with all drivers
            // For database cache, consider storing keys separately
            Cache::forget($pattern);
        }
    }

    /**
     * Invalidate invoice-related caches
     */
    public static function invalidateInvoiceCaches(int $tenantId, ?int $customerId = null): void
    {
        // Invalidate report caches
        Cache::forget("report:revenue:{$tenantId}:" . date('Y-m'));
        Cache::forget("report:profit:{$tenantId}:" . date('Y-m'));
        Cache::forget("report:tax:{$tenantId}:" . date('Y-m'));

        // Invalidate customer list if specific customer affected
        if ($customerId) {
            Cache::forget("customers:{$tenantId}:*");
        }
    }

    /**
     * Invalidate customer-related caches
     */
    public static function invalidateCustomerCaches(int $tenantId): void
    {
        Cache::forget("customers:{$tenantId}:*");
        static::invalidateTenantCache($tenantId);
    }

    /**
     * Invalidate partner-related caches
     */
    public static function invalidatePartnerCaches(int $tenantId): void
    {
        Cache::forget("partners:{$tenantId}");
        static::invalidateTenantCache($tenantId);
    }

    /**
     * Get cache key for debugging
     */
    public static function debugCacheKey(string $key): ?string
    {
        return Cache::get($key);
    }

    /**
     * Flush all application caches
     */
    public static function flushAll(): void
    {
        Cache::flush();
    }
}
