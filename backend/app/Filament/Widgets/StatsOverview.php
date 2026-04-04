<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Project;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('System Tenants', Tenant::count())
                ->description('Active business entities')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->chart([7, 2, 10, 3, 15, 4, 17])
                ->color('success'),
            Stat::make('Registered Users', User::count())
                ->description('Total accounts created')
                ->descriptionIcon('heroicon-m-user-group')
                ->chart([15, 4, 10, 2, 12, 4, 11])
                ->color('info'),
            Stat::make('Open Projects', Project::whereIn('status', ['in_progress', 'new', 'pending'])->count())
                ->description('Requiring active management')
                ->descriptionIcon('heroicon-m-clipboard-document-check')
                ->chart([10, 15, 8, 12, 11, 14, 16])
                ->color('warning'),
        ];
    }
}
