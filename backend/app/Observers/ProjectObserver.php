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
            $tenantId = $project->tenant_id ?? 1;

            // Load all project number settings for this tenant
            $settings = TenantSetting::where('tenant_id', $tenantId)
                ->where('key', 'like', 'project_%')
                ->pluck('value', 'key')
                ->toArray();

            $prefix    = $settings['project_id_prefix'] ?? 'P';
            $sep       = ($settings['project_separator'] ?? '-') === 'none' ? '' : ($settings['project_separator'] ?? '-');
            $padding   = (int) ($settings['project_padding'] ?? 5);
            $yearFmt   = $settings['project_year_format'] ?? 'YYYY';
            $monthFmt  = $settings['project_month_format'] ?? 'none';
            $dayFmt    = $settings['project_day_format'] ?? 'none';

            $now = now();

            // Build the date parts (same logic as HasDisplayId)
            $yearPart = '';
            if ($yearFmt === 'YYYY') {
                $yearPart = $now->format('Y');
            } elseif ($yearFmt === 'YY') {
                $yearPart = $now->format('y');
            }

            $monthPart = ($monthFmt === 'MM') ? $now->format('m') : '';
            $dayPart   = ($dayFmt === 'DD')   ? $now->format('d') : '';

            // Build the static prefix used to find existing numbers in the same period
            $staticParts = array_filter([$prefix, $yearPart, $monthPart, $dayPart], fn($p) => $p !== '');
            $basePrefix  = implode($sep, $staticParts);
            $searchBase  = $basePrefix . ($basePrefix !== '' ? $sep : '');

            // Find the highest existing number with the same base prefix
            $latest = Project::where('tenant_id', $tenantId)
                ->where('project_number', 'like', $searchBase . '%')
                ->orderByRaw('LENGTH(project_number) DESC')
                ->orderBy('project_number', 'desc')
                ->first();

            $number = 1;
            if ($latest) {
                $tail = substr($latest->project_number, strlen($searchBase));
                if (is_numeric($tail)) {
                    $number = (int) $tail + 1;
                }
            }

            $nrPart = str_pad($number, $padding, '0', STR_PAD_LEFT);
            $project->project_number = $searchBase . $nrPart;
            $project->custom_id      = $project->project_number;
        }
    }

    public function saved(Project $project): void
    {
        try {
            broadcast(new ProjectUpdated('saved'));
        } catch (\Exception $e) {
            \Log::warning("Broadcasting failed in ProjectObserver: " . $e->getMessage());
        }
    }

    public function deleted(Project $project): void
    {
        try {
            broadcast(new ProjectUpdated('deleted'));
        } catch (\Exception $e) {
            \Log::warning("Broadcasting failed in ProjectObserver: " . $e->getMessage());
        }
    }
}
