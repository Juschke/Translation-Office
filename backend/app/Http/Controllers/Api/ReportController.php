<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function getDateRange(Request $request) {
        $startDateStr = $request->query('startDate');
        $endDateStr = $request->query('endDate');

        $start = ($startDateStr && $startDateStr !== 'undefined' && $startDateStr !== 'null') 
            ? Carbon::parse($startDateStr)->startOfDay() 
            : Carbon::now()->subMonths(5)->startOfMonth();

        $end = ($endDateStr && $endDateStr !== 'undefined' && $endDateStr !== 'null') 
            ? Carbon::parse($endDateStr)->endOfDay() 
            : Carbon::now()->endOfMonth();

        return [$start, $end];
    }

    public function revenue(Request $request)
    {
        Carbon::setLocale('de');
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $data = Project::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('DATE_FORMAT(created_at, "%Y-%m-%d") as date_val'),
            DB::raw('SUM(price_total) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $labels = [];
        $values = [];

        // Fill gaps if range is small enough, otherwise just show months
        $current = $startDate->copy();
        while ($current <= $endDate) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');
            
            $match = $data->first(function($item) use ($m) {
                return str_starts_with($item->month, $m);
            });
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
        [$startDate, $endDate] = $this->getDateRange($request);

        $data = Project::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('SUM(price_total) as revenue'),
            DB::raw('SUM(partner_cost_net) as cost')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('month')
            ->get();

        $labels = [];
        $margins = [];

        $current = $startDate->copy();
        while ($current <= $endDate) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');

            $match = $data->first(function($item) use ($m) {
                return str_starts_with($item->month, $m);
            });
            
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

    public function languageDistribution(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $data = Project::join('languages', 'projects.target_lang_id', '=', 'languages.id')
            ->select(
                'languages.name_internal', 
                DB::raw('count(*) as count'),
                DB::raw('SUM(projects.price_total) as revenue')
            )
            ->whereBetween('projects.created_at', [$startDate, $endDate])
            ->groupBy('languages.name_internal')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        $total = $data->sum('count');
        $labels = $data->pluck('name_internal')->toArray();
        $revenues = $data->pluck('revenue')->map(fn($v) => round($v, 2))->toArray();
        $percentages = $data->map(fn($item) => $total > 0 ? round(($item->count / $total) * 100, 1) : 0)->toArray();

        // frontend expects { labels, data (percentages/counts), revenue (actual amounts) }
        return response()->json([
            'labels' => $labels,
            'data' => $percentages,
            'revenue' => $revenues,
            'count' => $data->pluck('count')->toArray()
        ]);
    }

    public function kpis(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $query = Project::whereBetween('created_at', [$startDate, $endDate]);
        
        $totalRevenue = (float) $query->sum('price_total');
        $totalCost = (float) $query->sum('partner_cost_net');
        $totalJobs = $query->count();

        $margin = 0;
        if ($totalRevenue > 0) {
            $margin = round((($totalRevenue - $totalCost) / $totalRevenue) * 100, 1);
        }

        // GROWTH: Compare to previous period of SAME LENGTH
        $diffInDays = $startDate->diffInDays($endDate) + 1;
        $prevStartDate = $startDate->copy()->subDays($diffInDays);
        $prevEndDate = $endDate->copy()->subDays($diffInDays);

        $prevRevenue = Project::whereBetween('created_at', [$prevStartDate, $prevEndDate])->sum('price_total');
        
        $growth = 0;
        if ($prevRevenue > 0) {
            $growth = round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 1);
        } else if ($totalRevenue > 0) {
            $growth = 100;
        }

        return response()->json([
            'revenue' => $totalRevenue,
            'margin' => $margin,
            'jobs' => $totalJobs,
            'growth' => $growth
        ]);
    }

    public function customers(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $data = Project::join('customers', 'projects.customer_id', '=', 'customers.id')
            ->select(
                'customers.name', // Assuming customer has 'name'
                DB::raw('SUM(projects.price_total) as revenue')
            )
            ->whereBetween('projects.created_at', [$startDate, $endDate])
            ->groupBy('customers.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return response()->json([
            'labels' => $data->pluck('name')->toArray(),
            'revenue' => $data->pluck('revenue')->map(fn($v) => round($v, 2))->toArray()
        ]);
    }

    public function summary(Request $request)
    {
        return response()->json([
            'kpis' => $this->kpis($request)->original,
            'revenue' => $this->revenue($request)->original,
            'profit' => $this->profitMargin($request)->original,
            'languages' => $this->languageDistribution($request)->original,
            'customers' => $this->customers($request)->original,
            'status' => $this->projectStatus($request)->original,
        ]);
    }

    public function projectStatus(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $data = Project::select('status', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();
            
        return response()->json([
            'labels' => $data->pluck('status')->map(function($s) {
                // simple mapping, ideally use a helper or enum
                $map = [
                    'request' => 'Anfrage',
                    'calculation' => 'Kalkulation',
                    'offer' => 'Angebot',
                    'ordered' => 'Beauftragt',
                    'in_progress' => 'In Bearbeitung',
                    'review' => 'Lektorat',
                    'delivered' => 'Geliefert',
                    'invoiced' => 'Abgerechnet',
                    'paid' => 'Bezahlt',
                    'archived' => 'Archiviert'
                ];
                return $map[$s] ?? ucfirst($s);
            })->toArray(),
            'data' => $data->pluck('count')->toArray()
        ]);
    }
}
