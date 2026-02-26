<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\ApiRequestLog;
use Illuminate\Support\Facades\DB;

class HealthStatusOverview extends StatsOverviewWidget
{
    protected ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        $avgLatency = ApiRequestLog::where('created_at', '>=', now()->subMinutes(60))->avg('duration_ms');
        $errorRate = ApiRequestLog::where('created_at', '>=', now()->subMinutes(60))
            ->where('status_code', '>=', 500)
            ->count();
        $totalRequests = ApiRequestLog::where('created_at', '>=', now()->subMinutes(60))->count();

        $errorPercentage = $totalRequests > 0 ? ($errorRate / $totalRequests) * 100 : 0;

        return [
            Stat::make('Avg API Latency (1h)', round($avgLatency ?? 0) . ' ms')
                ->description($avgLatency > 200 ? 'High Latency' : 'Healthy')
                ->descriptionIcon($avgLatency > 200 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-check-circle')
                ->color($avgLatency > 200 ? 'danger' : 'success'),
            Stat::make('API Error Rate (1h)', round($errorPercentage, 2) . '%')
                ->description($errorRate . ' failed requests')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($errorPercentage > 5 ? 'danger' : 'success'),
            Stat::make('Total Traffic (1h)', $totalRequests)
                ->description('Requests processed')
                ->descriptionIcon('heroicon-m-globe-alt')
                ->color('info'),
        ];
    }
}
