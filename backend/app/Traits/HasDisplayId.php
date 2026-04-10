<?php

namespace App\Traits;

use App\Models\TenantSetting;
use Carbon\Carbon;

trait HasDisplayId
{
    /**
     * Get the display ID with prefix and custom formatting.
     * 
     * @return string
     */
    public function getDisplayIdAttribute()
    {
        // If it's a project and has a project_number, use that instead of ID
        if (isset($this->project_number) && $this->project_number) {
            return $this->project_number;
        }

        return $this->generateFormattedDisplayId();
    }

    /**
     * Build the display ID based on tenant settings.
     * 
     * @return string
     */
    protected function generateFormattedDisplayId()
    {
        $tenantId = $this->tenant_id ?? 1;
        $class = class_basename($this);
        $entityId = $this->id;
        $date = $this->created_at ?? now();

        // 1. Determine the setting group (e.g. 'customer_')
        $group = strtolower($class);
        $mapping = [
            'Customer' => 'customer',
            'Project' => 'project',
            'Partner' => 'partner',
            'Appointment' => 'appointment',
            'Invoice' => 'invoice',
            'CreditNote' => 'credit_note',
            'Offer' => 'offer',
        ];

        if (isset($mapping[$class])) {
            $group = $mapping[$class];
        }

        // Special handling for Partner types if it's a Partner model
        if ($class === 'Partner') {
            $type = $this->type ?? 'translator';
            // Note: We use the partner group for all partner types for now to match frontend logic
            // unless specific prefixes are set.
        }

        // 2. Fetch all relevant settings
        $settings = TenantSetting::where('tenant_id', $tenantId)
            ->where('key', 'like', $group . '_%')
            ->pluck('value', 'key')
            ->toArray();

        // Keys mapping
        $prefixKey = ($group === 'invoice' || $group === 'credit_note') ? $group . '_prefix' : $group . '_id_prefix';
        $yearKey = $group . '_year_format';
        $monthKey = $group . '_month_format';
        $dayKey = $group . '_day_format';
        $sepKey = $group . '_separator';
        $padKey = $group . '_padding';

        // 3. Build parts
        $prefix = $settings[$prefixKey] ?? '';
        $sep = ($settings[$sepKey] ?? '-') === 'none' ? '' : ($settings[$sepKey] ?? '-');
        $padding = (int) ($settings[$padKey] ?? 4);

        $yearPart = '';
        // Default to 'none' for all groups unless settings say otherwise
        $yearFormat = $settings[$yearKey] ?? 'none';
        if ($yearFormat === 'YYYY')
            $yearPart = $date->format('Y');
        elseif ($yearFormat === 'YY')
            $yearPart = $date->format('y');

        $monthPart = '';
        if (($settings[$monthKey] ?? 'none') === 'MM')
            $monthPart = $date->format('m');

        $dayPart = '';
        if (($settings[$dayKey] ?? 'none') === 'DD')
            $dayPart = $date->format('d');

        $nrPart = str_pad($entityId, $padding, '0', STR_PAD_LEFT);

        // 4. Join components
        $parts = array_filter([$prefix, $yearPart, $monthPart, $dayPart, $nrPart], function ($p) {
            return $p !== '';
        });

        return implode($sep, $parts);
    }
}
