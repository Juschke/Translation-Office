<?php

namespace App\Filament\Widgets;

use App\Models\ApiRequestLog;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ApiLatencyChart extends ChartWidget
{
    protected ?string $heading = 'API Latency (Average ms/hr)';

    protected string|null $pollingInterval = '30s';

    protected function getData(): array
    {
        $data = ApiRequestLog::select(
            DB::raw('AVG(duration_ms) as avg_duration'),
            DB::raw('HOUR(created_at) as hour')
        )
            ->where('created_at', '>=', now()->subHours(12))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return [
            'datasets' => [
                [
                    'label' => 'Latency (ms)',
                    'data' => $data->map(fn($item) => round($item->avg_duration))->toArray(),
                    'fill' => 'start',
                    'tension' => 0.4,
                    'borderColor' => '#1B4D4F',
                    'backgroundColor' => 'rgba(27, 77, 79, 0.1)',
                ],
            ],
            'labels' => $data->map(fn($item) => str_pad($item->hour, 2, '0', STR_PAD_LEFT) . ':00')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
