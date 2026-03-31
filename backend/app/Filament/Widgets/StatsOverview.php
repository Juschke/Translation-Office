<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\ApiRequestLog;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantInvoice;
use App\Models\User;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $mrrCents = Subscription::query()
            ->whereIn('status', [Subscription::STATUS_ACTIVE, Subscription::STATUS_TRIAL])
            ->sum(\Illuminate\Support\Facades\DB::raw("
                CASE
                    WHEN billing_cycle = 'yearly' THEN ROUND(price_gross_cents / 12)
                    ELSE price_gross_cents
                END
            "));

        $apiErrorsToday = ApiRequestLog::query()
            ->where('status_code', '>=', 500)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        return [
            Stat::make('Aktive Mandanten', Tenant::where('is_active', true)->count())
                ->description('Plattformweit aktive Kundenkonten')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->chart([7, 2, 10, 3, 15, 4, 17])
                ->color('success'),
            Stat::make('API Nutzerkonten', User::count())
                ->description('Registrierte Accounts inkl. Tenant-Usern')
                ->descriptionIcon('heroicon-m-user-group')
                ->chart([15, 4, 10, 2, 12, 4, 11])
                ->color('info'),
            Stat::make('MRR', 'EUR ' . number_format($mrrCents / 100, 2, ',', '.'))
                ->description('Monatlich normalisierter Abo-Umsatz')
                ->descriptionIcon('heroicon-m-banknotes')
                ->chart([9, 11, 12, 14, 16, 18, 20])
                ->color('primary'),
            Stat::make('Offene Abrechnungen', TenantInvoice::whereIn('status', ['pending', 'open', 'failed'])->count())
                ->description('Plattform-Rechnungen mit Handlungsbedarf')
                ->descriptionIcon('heroicon-m-document-currency-euro')
                ->chart([5, 7, 6, 8, 9, 8, 10])
                ->color('warning'),
            Stat::make('API 5xx heute', $apiErrorsToday)
                ->description('Serverfehler in den letzten 24 Stunden')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->chart([1, 3, 2, 5, 4, 3, 2])
                ->color($apiErrorsToday > 0 ? 'danger' : 'success'),
        ];
    }
}
