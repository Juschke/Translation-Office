<?php

namespace App\Traits;

use App\Models\TenantSetting;

trait HasDisplayId
{
    /**
     * Get the display ID with prefix.
     * 
     * @return string
     */
    public function getDisplayIdAttribute()
    {
        $prefix = $this->getDisplayPrefix();
        $id = $this->id;

        // If it's a project and has a project_number, use that instead of ID if it doesn't already have the prefix
        if (isset($this->project_number) && $this->project_number) {
            return $this->project_number;
        }

        return $prefix . str_pad($id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get the prefix for the current model type.
     * 
     * @return string
     */
    protected function getDisplayPrefix()
    {
        $tenantId = $this->tenant_id ?? 1;
        $class = class_basename($this);

        $key = strtolower($class) . '_id_prefix';

        // Map specific classes if names don't match setting keys exactly
        $mapping = [
            'Customer' => 'customer_id_prefix',
            'Project' => 'project_id_prefix',
            'Partner' => 'partner_id_prefix',
            'Appointment' => 'appointment_id_prefix',
            'Invoice' => 'invoice_id_prefix',
        ];

        if (isset($mapping[$class])) {
            $key = $mapping[$class];
        }

        $defaultPrefixes = [
            'customer_id_prefix' => 'K',
            'project_id_prefix' => 'P',
            'partner_id_prefix' => 'PR',
            'appointment_id_prefix' => 'A',
            'invoice_id_prefix' => 'RE',
        ];

        $prefix = TenantSetting::where('tenant_id', $tenantId)
            ->where('key', $key)
            ->value('value');

        return $prefix ?? ($defaultPrefixes[$key] ?? '');
    }
}
