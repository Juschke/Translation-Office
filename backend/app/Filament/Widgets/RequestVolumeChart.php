<?php

namespace App\Filament\Widgets;

use App\Models\ApiRequestLog;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RequestVolumeChart extends ChartWidget
{
    protected ?string $heading = 'API Request Volume (Last 24h)';

    protected int|string|array $columnSpan = 'full';

    protected string|null $pollingInterval = '60s';

    protected function getData(): array
    {
        $data = ApiRequestLog::select(
            DB::raw('COUNT(*) as total'),
            DB::raw('HOUR(created_at) as hour')
        )
            ->where('created_at', '>=', now()->subHours(24))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return [
            'datasets' => [
                [
                    'label' => 'Total Requests',
                    'data' => $data->map(fn($item) => $item->total)->toArray(),
                    'backgroundColor' => '#9BCB56', // Brand Accent color
                    'borderColor' => '#88b548',
                    'borderWidth' => 1,
                ],
            ],
            'labels' => $data->map(fn($item) => str_pad($item->hour, 2, '0', STR_PAD_LEFT) . ':00')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
