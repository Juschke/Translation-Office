<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceExportController extends Controller
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

    public function exportTax(Request $request)
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        Carbon::setLocale('de');

        // This uses the exact same logic as ReportController::taxReport
        $data = Invoice::whereBetween('date', [$startDate, $endDate])
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

        $partnerCosts = Project::whereBetween('created_at', [$startDate, $endDate])
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

            $basisVorsteuer = $monthCost ? (float)$monthCost->cost : 0;
            $vorsteuerEst = ($basisVorsteuer) * 0.19;

            $report[] = [
                'Monat' => $current->translatedFormat('F Y'),
                'Umsatz_Netto_19' => (float)$net19,
                'Umsatz_Netto_7' => (float)$net7,
                'Umsatz_Netto_Reverse_Charge' => (float)$reverse,
                'Umsatzsteuer_19' => (float)$tax19,
                'Umsatzsteuer_7' => (float)$tax7,
                'Vorsteuer_Schaetzung' => $vorsteuerEst,
                'Zahllast' => (float)$monthData->sum('tax') - $vorsteuerEst
            ];

            $current->addMonth();
        }

        $report = array_reverse($report);

        $csv = "Monat;Umsatz Netto 19%;Umsatz Netto 7%;Reverse Charge;Umsatzsteuer 19%;Umsatzsteuer 7%;Vorsteuer (Schaetzung);Zahllast\n";
        
        foreach ($report as $row) {
            $csv .= sprintf(
                "%s;%s;%s;%s;%s;%s;%s;%s\n",
                $row['Monat'],
                number_format($row['Umsatz_Netto_19'], 2, ',', ''),
                number_format($row['Umsatz_Netto_7'], 2, ',', ''),
                number_format($row['Umsatz_Netto_Reverse_Charge'], 2, ',', ''),
                number_format($row['Umsatzsteuer_19'], 2, ',', ''),
                number_format($row['Umsatzsteuer_7'], 2, ',', ''),
                number_format($row['Vorsteuer_Schaetzung'], 2, ',', ''),
                number_format($row['Zahllast'], 2, ',', '')
            );
        }

        // Add totals row
        $csv .= sprintf(
            "Gesamt;%s;%s;%s;%s;%s;%s;%s\n",
            number_format(array_sum(array_column($report, 'Umsatz_Netto_19')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Umsatz_Netto_7')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Umsatz_Netto_Reverse_Charge')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Umsatzsteuer_19')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Umsatzsteuer_7')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Vorsteuer_Schaetzung')), 2, ',', ''),
            number_format(array_sum(array_column($report, 'Zahllast')), 2, ',', '')
        );

        $filename = 'UStVA_Export_' . $startDate->format('Ymd') . '-' . $endDate->format('Ymd') . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportOpos(Request $request)
    {
        $query = Invoice::whereNotIn('status', ['paid', 'cancelled', 'deleted', 'draft'])
            ->with('customer:id,company_name,first_name,last_name')
            ->orderBy('due_date', 'asc');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $invoices = $query->get();

        $headers = ['Rechnungsnr.', 'Kunde', 'Rechnungsdatum', 'Fälligkeit', 'Betrag (€)', 'Bezahlt (€)', 'Offen (€)', 'Tage überfällig', 'Mahnstufe', '0-30', '31-60', '61-90', '90+'];

        $rows = $invoices->map(function ($inv) {
            $customerName = $inv->snapshot_customer_name
                ?? ($inv->customer?->company_name ?: trim(($inv->customer?->first_name ?? '') . ' ' . ($inv->customer?->last_name ?? '')))
                ?? 'N/A';

            $amountGross = $inv->amount_gross / 100;
            $paidAmount  = $inv->paid_amount_eur ?? 0;
            $amountDue   = max(0, $amountGross - $paidAmount);
            $daysOverdue = $inv->due_date && Carbon::parse($inv->due_date)->isPast()
                ? (int) Carbon::parse($inv->due_date)->diffInDays(now())
                : 0;

            return [
                $inv->invoice_number,
                $customerName,
                $inv->date ? Carbon::parse($inv->date)->format('d.m.Y') : '',
                $inv->due_date ? Carbon::parse($inv->due_date)->format('d.m.Y') : '',
                number_format($amountGross, 2, ',', '.'),
                number_format($paidAmount, 2, ',', '.'),
                number_format($amountDue, 2, ',', '.'),
                $daysOverdue,
                $inv->reminder_level ?? 0,
                ($daysOverdue > 0 && $daysOverdue <= 30) ? number_format($amountDue, 2, ',', '.') : '0,00',
                ($daysOverdue > 30 && $daysOverdue <= 60) ? number_format($amountDue, 2, ',', '.') : '0,00',
                ($daysOverdue > 60 && $daysOverdue <= 90) ? number_format($amountDue, 2, ',', '.') : '0,00',
                ($daysOverdue > 90) ? number_format($amountDue, 2, ',', '.') : '0,00',
            ];
        });

        $csv  = "\xEF\xBB\xBF"; // UTF-8 BOM für Excel
        $csv .= implode(';', $headers) . "\r\n";
        foreach ($rows as $row) {
            $csv .= implode(';', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $row)) . "\r\n";
        }

        $filename = 'OPO_Export_' . now()->format('Ymd') . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
