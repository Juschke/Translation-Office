<?php

namespace App\Observers;

use App\Models\Customer;
use App\Models\TenantSetting;

class CustomerObserver
{
    public function creating(Customer $customer): void
    {
        if (empty($customer->custom_id)) {
            $tenantId = $customer->tenant_id ?? 1;

            $settings = TenantSetting::where('tenant_id', $tenantId)
                ->where('key', 'like', 'customer_%')
                ->pluck('value', 'key')
                ->toArray();

            $prefix = $settings['customer_id_prefix'] ?? 'KD';
            $sep = ($settings['customer_separator'] ?? '-') === 'none' ? '' : ($settings['customer_separator'] ?? '-');
            $padding = (int) ($settings['customer_padding'] ?? 5);
            $yearFmt = $settings['customer_year_format'] ?? 'YYYY';

            $now = now();
            $yearPart = '';
            if ($yearFmt === 'YYYY') {
                $yearPart = $now->format('Y');
            } elseif ($yearFmt === 'YY') {
                $yearPart = $now->format('y');
            }

            $staticParts = array_filter([$prefix, $yearPart], fn($p) => $p !== '');
            $basePrefix = implode($sep, $staticParts);
            $searchBase = $basePrefix . ($basePrefix !== '' ? $sep : '');

            $latest = Customer::where('tenant_id', $tenantId)
                ->where('custom_id', 'like', $searchBase . '%')
                ->orderByRaw('LENGTH(custom_id) DESC')
                ->orderBy('custom_id', 'desc')
                ->first();

            $number = 1;
            if ($latest) {
                $tail = substr($latest->custom_id, strlen($searchBase));
                if (is_numeric($tail)) {
                    $number = (int) $tail + 1;
                }
            }

            $nrPart = str_pad($number, $padding, '0', STR_PAD_LEFT);
            $customer->custom_id = $searchBase . $nrPart;
        }
    }
}
