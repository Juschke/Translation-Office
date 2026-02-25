<?php

namespace App\Observers;

use App\Models\Project;
use App\Models\TenantSetting;
use App\Events\ProjectUpdated;

class ProjectObserver
{
    /**
     * Handle the Project "creating" event.
     */
    public function creating(Project $project): void
    {
        if (empty($project->project_number)) {
            // Format: P-YYMM-Sequence (e.g., P-2501-0001)
            $prefix = TenantSetting::where('key', 'project_id_prefix')->value('value') ?? 'P-';

            // Allow dynamic YEAR-MONTH in prefix
            $datePart = date('ym');

            $basePrefix = $prefix . (str_contains($prefix, '-') ? '' : '-') . $datePart . '-';

            $latest = Project::where('project_number', 'like', "{$basePrefix}%")
                ->orderByRaw('LENGTH(project_number) DESC')
                ->orderBy('project_number', 'desc')
                ->first();

            $number = 1;
            if ($latest) {
                $str = str_replace($basePrefix, '', $latest->project_number);
                if (is_numeric($str)) {
                    $number = intval($str) + 1;
                }
            }

            $project->project_number = $basePrefix . str_pad($number, 4, '0', STR_PAD_LEFT);
            $project->custom_id = $project->project_number;
        }
    }

    public function saved(Project $project): void
    {
        broadcast(new ProjectUpdated('saved'));
    }

    public function deleted(Project $project): void
    {
        broadcast(new ProjectUpdated('deleted'));
    }
}
