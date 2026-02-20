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
            Stat::make('Total Tenants', Tenant::count())
                ->description('Registered tenants in the system')
                ->descriptionIcon('heroicon-m-building-office')
                ->color('success'),
            Stat::make('Total Users', User::count())
                ->description('Total users globally')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),
            Stat::make('Active Projects', Project::whereIn('status', ['in_progress', 'new', 'pending'])->count())
                ->description('Across all tenants')
                ->descriptionIcon('heroicon-m-briefcase')
                ->color('warning'),
        ];
    }
}
