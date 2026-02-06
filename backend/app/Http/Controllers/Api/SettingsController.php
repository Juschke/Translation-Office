<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? 1;
        $settings = \App\Models\TenantSetting::where('tenant_id', $tenantId)->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? 1;

        $validated = $request->validate([
            'company_name' => 'nullable|string',
            'legal_form' => 'nullable|string',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'address_country' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'vat_id' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_iban' => 'nullable|string',
            'bank_bic' => 'nullable|string',
            'website' => 'nullable|string',
            'domain' => 'nullable|string',
            'currency' => 'nullable|string',
            'primary_color' => 'nullable|string',
            // SMTP settings
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|string',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            // ID Settings
            'customer_id_prefix' => 'nullable|string',
            'partner_id_prefix' => 'nullable|string',
            'project_id_prefix' => 'nullable|string',
            'invoice_id_prefix' => 'nullable|string',
            // Payment Methods
            'payment_method_type' => 'nullable|string',
            'paypal_email' => 'nullable|string',
            'stripe_api_key' => 'nullable|string',
            'stripe_secret' => 'nullable|string',
            'credit_card_provider' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            \App\Models\TenantSetting::updateOrCreate(
                ['tenant_id' => $tenantId, 'key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
