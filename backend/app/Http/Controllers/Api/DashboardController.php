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
    public function index(Request $request)
    {
        $startDateStr = $request->query('startDate');
        $endDateStr = $request->query('endDate');

        $startDate = ($startDateStr && $startDateStr !== 'undefined' && $startDateStr !== 'null') 
            ? Carbon::parse($startDateStr)->startOfDay() 
            : Carbon::now()->startOfMonth();

        $endDate = ($endDateStr && $endDateStr !== 'undefined' && $endDateStr !== 'null') 
            ? Carbon::parse($endDateStr)->endOfDay() 
            : Carbon::now()->endOfMonth();

        $today = Carbon::today();
        
        // 1. Project Counts (filtered by date if provided)
        $openProjectsCount = Project::whereIn('status', ['in_progress', 'review', 'quote_sent'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $deadlinesTodayCount = Project::whereDate('deadline', $today)->count();

        // 2. Revenue
        $monthlyRevenue = Project::whereBetween('created_at', [$startDate, $endDate])
            ->sum('price_total');

        // Revenue Trend: Compare to previous period of same length
        $diffInDays = $startDate->diffInDays($endDate) + 1;
        $prevStartDate = $startDate->copy()->subDays($diffInDays);
        $prevEndDate = $endDate->copy()->subDays($diffInDays);
        
        $lastMonthRevenue = Project::whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->sum('price_total');

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
        $recentProjects = Project::with(['customer', 'sourceLanguage', 'targetLanguage', 'targetLanguage']) // duplicated intentionally? no
            ->latest()
            ->limit(5)
            ->get();

        // 5. Language Stats (Aggregated for Dashboard)
        $languageStats = Project::join('languages', 'projects.target_lang_id', '=', 'languages.id')
            ->select('languages.name_internal as label', DB::raw('SUM(projects.price_total) as value'))
            ->whereBetween('projects.created_at', [$startDate, $endDate])
            ->groupBy('languages.name_internal')
            ->orderByDesc('value')
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
                'unread_emails' => \App\Models\Mail::where('folder', 'inbox')->where('is_read', false)->count(),
            ],
            'recent_projects' => $recentProjects,
            'language_revenue' => $languageStats
        ]);
    }
}
