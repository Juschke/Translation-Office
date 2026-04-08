<?php

namespace App\Observers;

use App\Models\Partner;
use App\Models\TenantSetting;

class PartnerObserver
{
    public function creating(Partner $partner): void
    {
        if (empty($partner->custom_id)) {
            $tenantId = $partner->tenant_id ?? 1;

            $settings = TenantSetting::where('tenant_id', $tenantId)
                ->where('key', 'like', 'partner_%')
                ->pluck('value', 'key')
                ->toArray();

            $prefix = $settings['partner_id_prefix'] ?? 'P';
            $sep = ($settings['partner_separator'] ?? '-') === 'none' ? '' : ($settings['partner_separator'] ?? '-');
            $padding = (int) ($settings['partner_padding'] ?? 5);
            $yearFmt = $settings['partner_year_format'] ?? 'YYYY';

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

            $latest = Partner::where('tenant_id', $tenantId)
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
            $partner->custom_id = $searchBase . $nrPart;
        }
    }
}
