<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Customer;
use App\Models\Partner;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // 1. Project Counts
        $openProjectsCount = Project::whereIn('status', ['in_progress', 'review', 'quote_sent'])->count();
        $deadlinesTodayCount = Project::whereDate('deadline', $today)->count();

        // 2. Revenue (based on projects price_total)
        $monthlyRevenue = Project::where('created_at', '>=', $startOfMonth)
            ->sum('price_total');

        $lastMonthRevenue = Project::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('price_total');

        // Revenue trend (percentage)
        $revenueTrend = 0;
        if ($lastMonthRevenue > 0) {
            $revenueTrend = (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        }

        // 3. Customer & Partner stats
        $activeCustomersCount = Customer::count();
        $activePartnersCount = Partner::count();

        // 5. Invoice stats
        $unpaidInvoicesCount = \App\Models\Invoice::whereIn('status', ['pending', 'overdue'])->count();
        $overdueInvoicesCount = \App\Models\Invoice::where('status', 'overdue')->count();

        // 4. Recent Projects
        $recentProjects = Project::with(['customer', 'sourceLanguage', 'targetLanguage'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'open_projects' => $openProjectsCount,
                'deadlines_today' => $deadlinesTodayCount,
                'monthly_revenue' => (float) $monthlyRevenue,
                'revenue_trend' => round($revenueTrend, 2),
                'active_customers' => $activeCustomersCount,
                'active_partners' => $activePartnersCount,
                'unpaid_invoices' => $unpaidInvoicesCount,
                'overdue_invoices' => $overdueInvoicesCount,
                'unread_emails' => 0, // Placeholder
            ],
            'recent_projects' => $recentProjects
        ]);
    }
}
