<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    private function getDateRange(Request $request)
    {
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
            DB::raw('SUM(price_total) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
            ->orderBy('month')
            ->get();

        $labels = [];
        $values = [];

        // Fill gaps if range is small enough, otherwise just show months
        $current = $startDate->copy();
        while ($current <= $endDate) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');

            $match = $data->first(function ($item) use ($m) {
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
            ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
            ->get();

        $labels = [];
        $margins = [];

        $current = $startDate->copy();
        while ($current <= $endDate) {
            $m = $current->format('Y-m');
            $labels[] = $current->translatedFormat('M Y');

            $match = $data->first(function ($item) use ($m) {
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
                DB::raw('COALESCE(customers.company_name, CONCAT(customers.first_name, " ", customers.last_name)) as name'),
                DB::raw('SUM(projects.price_total) as revenue')
            )
            ->whereBetween('projects.created_at', [$startDate, $endDate])
            ->groupBy('name')
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
        $tenantId = Auth::user()->tenant_id;
        $params = json_encode($request->all());
        $cacheKey = "report_summary_{$tenantId}_" . md5($params);

        return Cache::remember($cacheKey, 1800, function () use ($request) {
            return [
                'kpis' => $this->kpis($request)->original,
                'revenue' => $this->revenue($request)->original,
                'profit' => $this->profitMargin($request)->original,
                'languages' => $this->languageDistribution($request)->original,
                'customers' => $this->customers($request)->original,
                'status' => $this->projectStatus($request)->original,
            ];
        });
    }

    public function projectStatus(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $data = Project::select('status', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();

        return response()->json([
            'labels' => $data->pluck('status')->map(function ($s) {
                $map = [
                    'draft' => 'Entwurf',
                    'offer' => 'Angebot',
                    'pending' => 'In Wartestellung',
                    'in_progress' => 'Bearbeitung',
                    'review' => 'Lektorat/Review',
                    'ready_for_pickup' => 'Abholbereit',
                    'delivered' => 'Geliefert',
                    'invoiced' => 'Abgerechnet',
                    'completed' => 'Abgeschlossen',
                    'cancelled' => 'Storniert',
                    'archived' => 'Archiviert',
                    'deleted' => 'Gelöscht'
                ];
                return $map[$s] ?? ucfirst($s);
            })->toArray(),
            'data' => $data->pluck('count')->toArray()
        ]);
    }

    public function taxReport(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        Carbon::setLocale('de');

        // Group by month
        $data = \App\Models\Invoice::whereBetween('date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->where('status', '!=', 'deleted')
            ->select(
                DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
                'tax_exemption',
                'tax_rate',
                DB::raw('SUM(amount_net) as net'),
                DB::raw('SUM(amount_tax) as tax'),
                DB::raw('SUM(amount_gross) as gross')
            )
            ->groupBy(DB::raw('DATE_FORMAT(date, "%Y-%m")'), 'tax_exemption', 'tax_rate')
            ->get();

        // Also get partner costs for estimated input tax (Vorsteuer)
        $partnerCosts = \App\Models\Project::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(partner_cost_net) as cost')
            )
            ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
            ->get();

        $report = [];
        $current = $startDate->copy()->startOfMonth();
        $end = $endDate->copy()->endOfMonth();

        while ($current <= $end) {
            $month = $current->format('Y-m');
            
            $monthData = $data->where('month', $month);
            $monthCost = $partnerCosts->where('month', $month)->first();

            $standard = $monthData->where('tax_exemption', 'none')->first();
            $reverse = $monthData->where('tax_exemption', 'reverse_charge')->sum('net');
            $small = $monthData->where('tax_exemption', '§19_ustg')->sum('net');

            $net19 = $monthData->where('tax_exemption', 'none')->where('tax_rate', 19.00)->sum('net');
            $tax19 = $monthData->where('tax_exemption', 'none')->where('tax_rate', 19.00)->sum('tax');

            $net7 = $monthData->where('tax_exemption', 'none')->where('tax_rate', 7.00)->sum('net');
            $tax7 = $monthData->where('tax_exemption', 'none')->where('tax_rate', 7.00)->sum('tax');

            // Estimation: Assume 19% input tax on partner costs if not specified otherwise
            $basisVorsteuer = $monthCost ? (float)$monthCost->cost : 0;
            $vorsteuerEst = ($basisVorsteuer) * 0.19; // partner_cost_net is already in decimal format from DB, but we get sum as string/float

            $report[] = [
                'month' => $month,
                'label' => $current->translatedFormat('F Y'),
                'revenue_19_net' => (float)$net19,
                'revenue_19_tax' => (float)$tax19,
                'revenue_7_net' => (float)$net7,
                'revenue_7_tax' => (float)$tax7,
                'revenue_reverse_charge' => (float)$reverse,
                'revenue_small_business' => (float)$small,
                'total_net' => (float)$monthData->sum('net'),
                'total_tax' => (float)$monthData->sum('tax'),
                'total_gross' => (float)$monthData->sum('gross'),
                'input_tax_est' => $vorsteuerEst,
                'payable_tax' => (float)$monthData->sum('tax') - $vorsteuerEst
            ];

            $current->addMonth();
        }

        // Return descending order (newest first)
        return response()->json(array_reverse($report));
    }

    public function detailedProfitability(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);

        $projects = \App\Models\Project::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'deleted')
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $projects->map(function ($p) {
            $revenue = $p->price_total; // This is the final agreed price
            $cost = $p->partner_cost_net; // Total cost to partners
            $profit = $revenue - $cost;
            $margin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;

            return [
                'id' => $p->id,
                'project_number' => $p->project_number,
                'project_name' => $p->project_name,
                'date' => $p->created_at->format('d.m.Y'),
                'customer' => $p->customer ? ($p->customer->company_name ?: ($p->customer->first_name . ' ' . $p->customer->last_name)) : 'N/A',
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profit,
                'margin' => round($margin, 2),
                'status' => $p->status,
                'status_label' => $this->getStatusLabel($p->status)
            ];
        });

        return response()->json($data);
    }

    private function getStatusLabel(?string $status): string
    {
        $map = [
            'draft' => 'Entwurf',
            'offer' => 'Angebot',
            'pending' => 'Angebot',
            'in_progress' => 'Bearbeitung',
            'review' => 'Lektorat/Review',
            'ready_for_pickup' => 'Abholbereit',
            'delivered' => 'Geliefert',
            'invoiced' => 'Rechnung',
            'completed' => 'Abgeschlossen',
            'cancelled' => 'Storniert',
            'archived' => 'Archiviert',
            'deleted' => 'Gelöscht'
        ];
        return $map[$status] ?? ucfirst($status ?? '-');
    }

    public function oposReport(Request $request)
    {
        $query = \App\Models\Invoice::whereNotIn('status', ['paid', 'cancelled', 'deleted', 'draft'])
            ->with('customer:id,company_name,first_name,last_name')
            ->orderBy('due_date', 'asc');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $invoices = $query->get();

        $data = $invoices->map(function ($inv) {
            $customerName = $inv->snapshot_customer_name
                ?? ($inv->customer?->company_name ?: trim(($inv->customer?->first_name ?? '') . ' ' . ($inv->customer?->last_name ?? '')))
                ?? 'N/A';

            $amountGross  = $inv->amount_gross / 100;
            $paidAmount   = $inv->paid_amount_eur ?? 0;
            $amountDue    = max(0, $amountGross - $paidAmount);
            $daysOverdue  = 0;

            if ($inv->due_date && Carbon::parse($inv->due_date)->isPast()) {
                $daysOverdue = (int) Carbon::parse($inv->due_date)->diffInDays(Carbon::now());
            }

            return [
                'id'             => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'customer_id'    => $inv->customer_id,
                'customer'       => $customerName,
                'date'           => $inv->date ? Carbon::parse($inv->date)->format('d.m.Y') : '-',
                'due_date'       => $inv->due_date ? Carbon::parse($inv->due_date)->format('d.m.Y') : '-',
                'due_date_raw'   => $inv->due_date?->toDateString(),
                'amount_gross'   => $amountGross,
                'paid_amount'    => $paidAmount,
                'amount_due'     => $amountDue,
                'status'         => $inv->status,
                'reminder_level' => $inv->reminder_level ?? 0,
                'days_overdue'   => $daysOverdue,
                'bucket'         => match (true) {
                    $daysOverdue === 0 => 'current',
                    $daysOverdue <= 30  => '0_30',
                    $daysOverdue <= 60  => '31_60',
                    $daysOverdue <= 90  => '61_90',
                    default             => '90plus',
                },
            ];
        });

        $buckets = [
            'current' => ['count' => 0, 'amount' => 0],
            '0_30'    => ['count' => 0, 'amount' => 0],
            '31_60'   => ['count' => 0, 'amount' => 0],
            '61_90'   => ['count' => 0, 'amount' => 0],
            '90plus'  => ['count' => 0, 'amount' => 0],
        ];
        foreach ($data as $row) {
            $b = $row['bucket'];
            $buckets[$b]['count']++;
            $buckets[$b]['amount'] = round($buckets[$b]['amount'] + $row['amount_due'], 2);
        }

        return response()->json([
            'data'    => $data,
            'buckets' => $buckets,
            'total'   => [
                'count'  => $data->count(),
                'amount' => round($data->sum('amount_due'), 2),
            ],
        ]);
    }

    public function bwaReport(Request $request)
    {
        Carbon::setLocale('de');
        [$startDate, $endDate] = $this->getDateRange($request);

        // Get revenue from non-cancelled invoices
        $invoices = \App\Models\Invoice::whereBetween('date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled', 'deleted'])
            ->select(
                DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
                DB::raw('SUM(amount_net) as revenue')
            )
            ->groupBy(DB::raw('DATE_FORMAT(date, "%Y-%m")'))
            ->get();

        // Get partner costs from projects
        $costs = \App\Models\Project::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'deleted')
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(partner_cost_net) as cost')
            )
            ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
            ->get();

        $months = $invoices->pluck('month')->merge($costs->pluck('month'))->unique()->sort()->values();

        $data = $months->map(function ($month) use ($invoices, $costs) {
            $rev = $invoices->where('month', $month)->first();
            $revenueAmount = $rev ? ($rev->revenue / 100) : 0; // Convert cents to eur

            $cst = $costs->where('month', $month)->first();
            // project partner_cost_net is stored in Euros, not cents!
            $costAmount = $cst ? (float) $cst->cost : 0;

            $grossProfit = $revenueAmount - $costAmount;
            $margin = $revenueAmount > 0 ? ($grossProfit / $revenueAmount) * 100 : 0;

            return [
                'month' => $month,
                'label' => Carbon::parse($month . '-01')->translatedFormat('F Y'),
                'revenue' => round($revenueAmount, 2),
                'cost' => round($costAmount, 2),
                'gross_profit' => round($grossProfit, 2),
                'margin' => round($margin, 1)
            ];
        });

        return response()->json($data);
    }
}

