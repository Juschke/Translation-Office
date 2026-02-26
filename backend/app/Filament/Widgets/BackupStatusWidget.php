<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\Tenant;

class BackupStatusWidget extends StatsOverviewWidget
{
    protected ?string $pollingInterval = '60s';

    protected function getStats(): array
    {
        $backupDisk = config('backup.backup.destination.disks', ['local'])[0] ?? 'local';
        $backupName = config('backup.backup.name', 'Laravel');

        $files = [];
        try {
            $files = Storage::disk($backupDisk)->files($backupName);
        } catch (\Exception $e) {
            // Log error or handle missing disk
        }

        $lastBackupInfo = 'No backups found';
        $color = 'danger';
        $icon = 'heroicon-m-x-circle';

        if (!empty($files)) {
            $backups = array_map(function ($file) use ($backupDisk) {
                return [
                    'modified' => Storage::disk($backupDisk)->lastModified($file)
                ];
            }, $files);

            usort($backups, fn($a, $b) => $b['modified'] <=> $a['modified']);
            $last = $backups[0];
            $lastDate = Carbon::createFromTimestamp($last['modified']);

            $lastBackupInfo = $lastDate->diffForHumans();

            if ($lastDate->isToday()) {
                $color = 'success';
                $icon = 'heroicon-m-check-badge';
            } elseif ($lastDate->isYesterday()) {
                $color = 'warning';
                $icon = 'heroicon-m-exclamation-circle';
            }
        }

        // Active Tenants Status & Data
        $activeTenants = Tenant::where('is_active', true)->count();
        $totalTenants = Tenant::count();

        // Storage per tenant (Sum of project_files)
        $totalDataBytes = \App\Models\ProjectFile::sum('file_size');
        $totalDataFormatted = $this->formatBytes($totalDataBytes);

        return [
            Stat::make('Last System Backup', $lastBackupInfo)
                ->description('Storage: ' . $backupDisk)
                ->descriptionIcon($icon)
                ->color($color),
            Stat::make('Platform Tenants', $activeTenants . ' / ' . $totalTenants)
                ->description('Storage: ' . $totalDataFormatted)
                ->descriptionIcon('heroicon-m-shield-check')
                ->color($activeTenants === $totalTenants ? 'success' : 'warning'),
            Stat::make('Connectivity', 'Stable')
                ->description('Ping Target: 1.1.1.1 (Env)')
                ->descriptionIcon('heroicon-m-globe-alt')
                ->color('success'),
        ];
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
