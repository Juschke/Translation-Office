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
            ],
            'timestamp' => now()->toIso8601String()
        ];

        $allHealthy = collect($health['checks'])->every(fn($check) => $check['status'] === 'ok');
        $health['status'] = $allHealthy ? 'healthy' : 'degraded';

        return response()->json($health);
    }

    /**
     * Get performance metrics
     */
    public function metrics()
    {
        $metrics = [
            'requests' => [
                'total_today' => DB::table('telescope_entries')
                    ->where('type', 'request')
                    ->where('created_at', '>=', now()->startOfDay())
                    ->count(),
                'avg_response_time' => DB::table('telescope_entries')
                    ->where('type', 'request')
                    ->where('created_at', '>=', now()->subHour())
                    ->avg('content->duration'),
            ],
            'queries' => [
                'total_today' => DB::table('telescope_entries')
                    ->where('type', 'query')
                    ->where('created_at', '>=', now()->startOfDay())
                    ->count(),
                'slow_queries' => DB::table('telescope_entries')
                    ->where('type', 'query')
                    ->where('created_at', '>=', now()->subHour())
                    ->whereRaw('JSON_EXTRACT(content, "$.time") > 1000')
                    ->count(),
            ],
            'exceptions' => [
                'total_today' => DB::table('telescope_entries')
                    ->where('type', 'exception')
                    ->where('created_at', '>=', now()->startOfDay())
                    ->count(),
            ],
        ];

        return response()->json($metrics);
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
            return ['status' => 'ok', 'message' => "Queue driver: {$driver}"];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
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
