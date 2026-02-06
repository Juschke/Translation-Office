<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function revenue(Request $request)
    {
        Carbon::setLocale('de');
        $period = $request->query('period', '6m');
        $months = 6;
        if ($period === '1y')
            $months = 12;

        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $data = Project::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('SUM(price_total) as total')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $labels = [];
        $values = [];

        $current = $startDate->copy();
        for ($i = 0; $i < $months; $i++) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');

            $match = $data->firstWhere('month', $m);
            $values[] = $match ? (float) $match->total : 0;

            $current->addMonth();
        }

        return response()->json([
            'labels' => $labels,
            'data' => $values
        ]);
    }

    public function profitMargin(Request $request)
    {
        Carbon::setLocale('de');
        $period = $request->query('period', '6m');
        $months = 6;
        if ($period === '1y')
            $months = 12;

        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $data = Project::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('SUM(price_total) as revenue'),
            DB::raw('SUM(partner_cost_net) as cost')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('month')
            ->get();

        $labels = [];
        $margins = [];

        $current = $startDate->copy();
        for ($i = 0; $i < $months; $i++) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');

            $match = $data->firstWhere('month', $m);
            if ($match && $match->revenue > 0) {
                $profit = $match->revenue - $match->cost;
                $margin = ($profit / $match->revenue) * 100;
                $margins[] = round($margin, 1);
            } else {
                $margins[] = 0;
            }

            $current->addMonth();
        }

        return response()->json([
            'labels' => $labels,
            'data' => $margins
        ]);
    }

    public function languageDistribution()
    {
        $data = Project::join('languages', 'projects.target_lang_id', '=', 'languages.id')
            ->select('languages.name_internal', DB::raw('count(*) as count'))
            ->groupBy('languages.name_internal')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $total = $data->sum('count');
        $labels = $data->pluck('name_internal')->toArray();
        $percentages = $data->map(fn($item) => $total > 0 ? round(($item->count / $total) * 100, 1) : 0)->toArray();

        return response()->json([
            'labels' => $labels,
            'data' => $percentages
        ]);
    }

    public function kpis()
    {
        $totalRevenue = (float) Project::sum('price_total');
        $totalCost = (float) Project::sum('partner_cost_net');
        $totalJobs = Project::count();

        $margin = 0;
        if ($totalRevenue > 0) {
            $margin = round((($totalRevenue - $totalCost) / $totalRevenue) * 100, 1);
        }

        // GROWTH - Compare current month to same month last year (simple version)
        $currentMonthRevenue = Project::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('price_total');

        $lastYearMonthRevenue = Project::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->subYear()->year)
            ->sum('price_total');

        $growth = 0;
        if ($lastYearMonthRevenue > 0) {
            $growth = round((($currentMonthRevenue - $lastYearMonthRevenue) / $lastYearMonthRevenue) * 100, 1);
        } else if ($currentMonthRevenue > 0) {
            $growth = 100; // First year growth
        }

        return response()->json([
            'revenue' => $totalRevenue,
            'margin' => $margin,
            'jobs' => $totalJobs,
            'growth' => $growth
        ]);
    }
}
