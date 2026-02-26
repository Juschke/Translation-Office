<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Get system overview statistics
     */
    public function dashboard()
    {
        $stats = [
            'tenants' => [
                'total' => Tenant::count(),
                'active' => Tenant::where('is_active', true)->count(),
                'inactive' => Tenant::where('is_active', false)->count(),
            ],
            'users' => [
                'total' => User::count(),
                'active_today' => User::where('last_login_at', '>=', now()->subDay())->count(),
                'active_week' => User::where('last_login_at', '>=', now()->subWeek())->count(),
            ],
            'projects' => [
                'total' => Project::count(),
                'active' => Project::where('status', 'in_progress')->count(),
                'completed' => Project::where('status', 'completed')->count(),
            ],
            'storage' => [
                'total_files' => DB::table('project_files')->count(),
                'total_size' => DB::table('project_files')->sum('file_size'),
                'avg_file_size' => DB::table('project_files')->avg('file_size'),
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'database' => DB::connection()->getDatabaseName(),
                'cache_driver' => config('cache.default'),
                'queue_driver' => config('queue.default'),
            ]
        ];

        return response()->json($stats);
    }

    /**
     * Get all tenants with pagination
     */
    public function tenants(Request $request)
    {
        $query = Tenant::withCount(['users', 'projects'])
            ->with(['users' => function($q) {
                $q->where('is_admin', true)->select('id', 'tenant_id', 'name', 'email');
            }]);

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('domain', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('is_active', $request->status === 'active');
        }

        $tenants = $query->orderBy('created_at', 'desc')
                        ->paginate($request->per_page ?? 20);

        return response()->json($tenants);
    }

    /**
     * Get specific tenant details
     */
    public function showTenant($id)
    {
        $tenant = Tenant::withCount(['users', 'projects', 'customers', 'partners'])
            ->with(['users' => function($q) {
                $q->select('id', 'tenant_id', 'name', 'email', 'is_admin', 'last_login_at', 'created_at');
            }])
            ->findOrFail($id);

        // Get tenant statistics
        $stats = [
            'projects_by_status' => Project::where('tenant_id', $id)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'storage_usage' => DB::table('project_files')
                ->join('projects', 'project_files.project_id', '=', 'projects.id')
                ->where('projects.tenant_id', $id)
                ->sum('project_files.file_size'),
            'recent_activity' => Project::where('tenant_id', $id)
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get(['id', 'project_name', 'status', 'updated_at']),
        ];

        return response()->json([
            'tenant' => $tenant,
            'stats' => $stats
        ]);
    }

    /**
     * Update tenant
     */
    public function updateTenant(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => 'sometimes|string|max:255|unique:tenants,domain,' . $id,
            'is_active' => 'sometimes|boolean',
            'settings' => 'sometimes|array',
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->update($validated);

        return response()->json([
            'message' => 'Tenant updated successfully',
            'tenant' => $tenant
        ]);
    }

    /**
     * Suspend/Activate tenant
     */
    public function toggleTenantStatus($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->is_active = !$tenant->is_active;
        $tenant->save();

        return response()->json([
            'message' => $tenant->is_active ? 'Tenant activated' : 'Tenant suspended',
            'tenant' => $tenant
        ]);
    }

    /**
     * Get API request logs with filtering and pagination
     */
    public function apiLogs(Request $request)
    {
        $query = \App\Models\ApiRequestLog::query()
            ->with(['user:id,name,email', 'tenant:id,company_name'])
            ->orderBy('created_at', 'desc');

        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('created_at', '<=', $request->to_date);
        }

        // Filter by status code
        if ($request->has('status_code')) {
            $query->where('status_code', $request->status_code);
        }

        // Filter by status code range
        if ($request->has('status_range')) {
            switch ($request->status_range) {
                case '2xx':
                    $query->whereBetween('status_code', [200, 299]);
                    break;
                case '3xx':
                    $query->whereBetween('status_code', [300, 399]);
                    break;
                case '4xx':
                    $query->whereBetween('status_code', [400, 499]);
                    break;
                case '5xx':
                    $query->whereBetween('status_code', [500, 599]);
                    break;
            }
        }

        // Filter by method
        if ($request->has('method')) {
            $query->where('method', strtoupper($request->method));
        }

        // Filter by endpoint
        if ($request->has('endpoint')) {
            $query->where('endpoint', 'LIKE', '%' . $request->endpoint . '%');
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by tenant
        if ($request->has('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        // Filter by IP
        if ($request->has('ip_address')) {
            $query->where('ip_address', $request->ip_address);
        }

        // Filter slow requests
        if ($request->boolean('slow_only')) {
            $query->where('duration_ms', '>', 1000);
        }

        // Filter errors only
        if ($request->boolean('errors_only')) {
            $query->where('status_code', '>=', 400);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('url', 'LIKE', "%{$search}%")
                  ->orWhere('endpoint', 'LIKE', "%{$search}%")
                  ->orWhere('ip_address', 'LIKE', "%{$search}%")
                  ->orWhere('user_email', 'LIKE', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get single API request log details
     */
    public function apiLogDetails($id)
    {
        $log = \App\Models\ApiRequestLog::with(['user', 'tenant'])->findOrFail($id);

        return response()->json($log);
    }

    /**
     * Get API logs statistics
     */
    public function apiLogsStats(Request $request)
    {
        $from = $request->get('from_date', now()->subDay());
        $to = $request->get('to_date', now());

        $stats = [
            'total_requests' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])->count(),

            'by_status' => [
                'success' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->whereBetween('status_code', [200, 299])->count(),
                'redirect' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->whereBetween('status_code', [300, 399])->count(),
                'client_error' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->whereBetween('status_code', [400, 499])->count(),
                'server_error' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->whereBetween('status_code', [500, 599])->count(),
            ],

            'by_method' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                ->select('method', \DB::raw('count(*) as count'))
                ->groupBy('method')
                ->pluck('count', 'method'),

            'performance' => [
                'avg_duration_ms' => round(\App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->avg('duration_ms'), 2),
                'max_duration_ms' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->max('duration_ms'),
                'slow_requests' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                    ->where('duration_ms', '>', 1000)->count(),
            ],

            'top_endpoints' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                ->select('endpoint', 'method', \DB::raw('count(*) as count'), \DB::raw('avg(duration_ms) as avg_duration'))
                ->groupBy('endpoint', 'method')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),

            'top_errors' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                ->where('status_code', '>=', 400)
                ->select('endpoint', 'status_code', \DB::raw('count(*) as count'))
                ->groupBy('endpoint', 'status_code')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),

            'unique_users' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                ->whereNotNull('user_id')
                ->distinct('user_id')
                ->count(),

            'unique_ips' => \App\Models\ApiRequestLog::whereBetween('created_at', [$from, $to])
                ->distinct('ip_address')
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Clear old API logs
     */
    public function clearApiLogs(Request $request)
    {
        $days = $request->get('older_than_days', 30);

        $deleted = \App\Models\ApiRequestLog::where('created_at', '<', now()->subDays($days))->delete();

        return response()->json([
            'message' => "Deleted {$deleted} log entries older than {$days} days",
            'deleted_count' => $deleted
        ]);
    }

    /**
     * Get system logs
     */
    public function logs(Request $request)
    {
        $query = DB::table('telescope_entries')
            ->orderBy('created_at', 'desc');

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->search) {
            $query->where('content', 'like', "%{$request->search}%");
        }

        $logs = $query->paginate($request->per_page ?? 50);

        return response()->json($logs);
    }

    /**
     * Get system health check
     */
    public function health()
    {
        $health = [
            'status' => 'healthy',
            'checks' => [
                'database' => $this->checkDatabase(),
                'storage' => $this->checkStorage(),
                'cache' => $this->checkCache(),
                'queue' => $this->checkQueue(),
                'mail' => $this->checkMail(),
                'pulse' => $this->checkPulse(),
            ],
            'system_info' => [
                'php_version' => phpversion(),
                'laravel_version' => app()->version(),
                'environment' => config('app.env'),
                'uptime' => $this->getUptime(),
                'server_time' => now()->toDateTimeString(),
            ],
            'timestamp' => now()->toIso8601String()
        ];

        $allHealthy = collect($health['checks'])->every(fn($check) => $check['status'] === 'ok' || $check['status'] === 'warning');
        $hasErrors = collect($health['checks'])->contains(fn($check) => $check['status'] === 'error');
        $hasWarnings = collect($health['checks'])->contains(fn($check) => $check['status'] === 'warning');

        if ($hasErrors) {
            $health['status'] = 'unhealthy';
        } elseif ($hasWarnings) {
            $health['status'] = 'degraded';
        } else {
            $health['status'] = 'healthy';
        }

        return response()->json($health);
    }

    /**
     * Get performance metrics
     */
    public function metrics()
    {
        // System Metrics
        $metrics = [
            'system' => [
                'php_version' => phpversion(),
                'laravel_version' => app()->version(),
                'environment' => config('app.env'),
                'debug_mode' => config('app.debug'),
                'memory_usage' => $this->formatBytes(memory_get_usage(true)),
                'memory_peak' => $this->formatBytes(memory_get_peak_usage(true)),
                'memory_limit' => ini_get('memory_limit'),
            ],
            'database' => [
                'driver' => config('database.default'),
                'connection' => config('database.connections.' . config('database.default') . '.database'),
                'tables_count' => $this->getDatabaseTablesCount(),
                'total_records' => $this->getTotalRecords(),
            ],
            'application' => [
                'tenants_total' => \App\Models\Tenant::count(),
                'users_total' => \App\Models\User::count(),
                'projects_total' => \App\Models\Project::count(),
                'customers_total' => \App\Models\Customer::count(),
                'partners_total' => \App\Models\Partner::count(),
                'invoices_total' => \App\Models\Invoice::count(),
            ],
            'pulse' => [
                'enabled' => config('pulse.enabled', false),
                'storage_driver' => config('pulse.storage.driver', 'database'),
                'ingest_driver' => config('pulse.ingest.driver', 'storage'),
            ],
            'cache' => [
                'driver' => config('cache.default'),
                'prefix' => config('cache.prefix'),
            ],
            'queue' => [
                'driver' => config('queue.default'),
                'connection' => config('queue.connections.' . config('queue.default') . '.connection'),
            ],
            'session' => [
                'driver' => config('session.driver'),
                'lifetime' => config('session.lifetime') . ' minutes',
            ],
        ];

        return response()->json($metrics);
    }

    private function getDatabaseTablesCount()
    {
        try {
            $driver = config('database.default');
            if ($driver === 'mysql') {
                return count(DB::select('SHOW TABLES'));
            } elseif ($driver === 'sqlite') {
                return count(DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"));
            } elseif ($driver === 'pgsql') {
                return count(DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"));
            }
            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getTotalRecords()
    {
        try {
            $total = 0;
            $models = [
                \App\Models\User::class,
                \App\Models\Tenant::class,
                \App\Models\Project::class,
                \App\Models\Customer::class,
                \App\Models\Partner::class,
                \App\Models\Invoice::class,
            ];

            foreach ($models as $model) {
                $total += $model::count();
            }

            return $total;
        } catch (\Exception $e) {
            return 0;
        }
    }

    // Helper methods for health checks
    private function checkDatabase()
    {
        try {
            DB::connection()->getPdo();
            return ['status' => 'ok', 'message' => 'Database connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkStorage()
    {
        try {
            $path = storage_path('app');
            $free = disk_free_space($path);
            $total = disk_total_space($path);
            $used = $total - $free;
            $percentage = ($used / $total) * 100;

            return [
                'status' => $percentage < 90 ? 'ok' : 'warning',
                'message' => sprintf('%.2f%% used', $percentage),
                'details' => [
                    'free' => $this->formatBytes($free),
                    'total' => $this->formatBytes($total),
                    'used' => $this->formatBytes($used),
                ]
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkCache()
    {
        try {
            cache()->put('health_check', 'ok', 10);
            $value = cache()->get('health_check');
            return ['status' => $value === 'ok' ? 'ok' : 'error', 'message' => 'Cache working'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkQueue()
    {
        try {
            $driver = config('queue.default');

            // Check for failed jobs
            $failedJobs = DB::table('failed_jobs')->count();

            if ($failedJobs > 50) {
                return [
                    'status' => 'warning',
                    'message' => "Queue driver: {$driver}, {$failedJobs} failed jobs",
                    'details' => ['failed_jobs' => $failedJobs]
                ];
            }

            return [
                'status' => 'ok',
                'message' => "Queue driver: {$driver}",
                'details' => ['failed_jobs' => $failedJobs]
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkMail()
    {
        try {
            $driver = config('mail.default');
            $from = config('mail.from.address');

            if (empty($from)) {
                return [
                    'status' => 'warning',
                    'message' => 'Mail from address not configured'
                ];
            }

            return [
                'status' => 'ok',
                'message' => "Mail driver: {$driver}",
                'details' => ['driver' => $driver, 'from' => $from]
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkPulse()
    {
        try {
            $enabled = config('pulse.enabled', false);

            if (!$enabled) {
                return [
                    'status' => 'warning',
                    'message' => 'Pulse is disabled'
                ];
            }

            // Check if Pulse tables exist and have data
            $entriesCount = DB::table('pulse_entries')->count();

            return [
                'status' => 'ok',
                'message' => 'Pulse is active',
                'details' => [
                    'enabled' => true,
                    'entries_count' => $entriesCount,
                    'storage_driver' => config('pulse.storage.driver'),
                ]
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Pulse not available: ' . $e->getMessage()
            ];
        }
    }

    private function getUptime()
    {
        try {
            // Try to get system uptime
            if (PHP_OS_FAMILY === 'Windows') {
                // For Windows, we'll just show when the app was last booted
                return 'N/A (Windows)';
            } else {
                $uptime = shell_exec('uptime -p');
                return trim($uptime) ?: 'Unknown';
            }
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
