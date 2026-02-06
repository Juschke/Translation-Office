<?php

namespace App\Observers;

use App\Models\Project;
use App\Models\TenantSetting;

class ProjectObserver
{
    /**
     * Handle the Project "creating" event.
     */
    public function creating(Project $project): void
    {
        if (empty($project->custom_id)) {
            // Format: PO-YYMM-Sequence (e.g., PO-2501-0001)
            $prefix = TenantSetting::where('key', 'project_id_prefix')->value('value') ?? 'PO-';

            // Allow dynamic YEAR-MONTH in prefix if configured, but easier to hardcode the pattern requested:
            // PO-2501-xxxx
            $datePart = date('ym'); // 2501 for Jan 2025

            $basePrefix = $prefix . $datePart . '-';

            $latest = Project::where('custom_id', 'like', "{$basePrefix}%")
                ->orderByRaw('LENGTH(custom_id) DESC')
                ->orderBy('custom_id', 'desc')
                ->first();

            $number = 1;
            if ($latest) {
                $str = str_replace($basePrefix, '', $latest->custom_id);
                if (is_numeric($str)) {
                    $number = intval($str) + 1;
                }
            }

            $project->custom_id = $basePrefix . str_pad($number, 4, '0', STR_PAD_LEFT);
        }
    }
}
