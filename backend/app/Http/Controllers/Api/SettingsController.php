<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        $settings = \App\Models\TenantSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string',
            'legal_form' => 'nullable|string',
            'address_street' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'vat_id' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'iban' => 'nullable|string',
            'bic' => 'nullable|string',
            'website' => 'nullable|string',
            'primary_color' => 'nullable|string',
            // SMTP settings should be handled carefully, maybe separate endpoint or specific permission
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|string',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            \App\Models\TenantSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
