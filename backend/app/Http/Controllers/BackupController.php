<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupController extends Controller
{
    /**
     * Get the status of the last backup.
     */
    public function lastBackup()
    {
        $backupDisk = config('backup.backup.destination.disks', ['local'])[0];
        $files = Storage::disk($backupDisk)->files(config('backup.backup.name', 'Laravel'));

        if (empty($files)) {
            return response()->json([
                'status' => 'no_backups',
                'message' => 'No backups found on ' . $backupDisk,
                'last_backup' => null
            ]);
        }

        // Filter and sort by last modified
        $backups = array_map(function ($file) use ($backupDisk) {
            return [
                'name' => basename($file),
                'size' => Storage::disk($backupDisk)->size($file),
                'modified' => Storage::disk($backupDisk)->lastModified($file)
            ];
        }, $files);

        usort($backups, fn($a, $b) => $b['modified'] <=> $a['modified']);
        $last = $backups[0];

        return response()->json([
            'status' => 'success',
            'last_backup' => [
                'name' => $last['name'],
                'size_mb' => round($last['size'] / 1024 / 1024, 2),
                'at' => Carbon::createFromTimestamp($last['modified'])->toDateTimeString(),
                'diff' => Carbon::createFromTimestamp($last['modified'])->diffForHumans()
            ]
        ]);
    }
}
