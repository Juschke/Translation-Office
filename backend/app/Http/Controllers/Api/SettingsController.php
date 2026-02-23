<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);

        // Get all key-value settings
        $settings = \App\Models\TenantSetting::where('tenant_id', $tenantId)->pluck('value', 'key')->toArray();

        // Basic fields from tenant model that should be available if not in settings
        $tenantData = $tenant ? $tenant->toArray() : [];

        // Merge: Settings overwrite tenant model defaults
        $response = array_merge($tenantData, $settings);

        return response()->json($response);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);

        $validated = $request->validate([
            'company_name' => 'nullable|string',
            'legal_form' => 'nullable|string',
            'managing_director' => 'nullable|string',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'address_country' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'opening_hours' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'vat_id' => 'nullable|string',
            'tax_office' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bank_iban' => 'nullable|string',
            'bank_bic' => 'nullable|string',
            'bank_code' => 'nullable|string',
            'bank_account_holder' => 'nullable|string',
            'website' => 'nullable|string',
            'domain' => 'nullable|string',
            'currency' => 'nullable|string',
            'logo' => 'nullable|file|image|max:4096',
            'invoice_layout' => 'nullable|string|in:din5008,modern,classic',
            'invoice_font_family' => 'nullable|string',
            'invoice_font_size' => 'nullable|string',
            'invoice_primary_color' => 'nullable|string',
        ]);

        // Fields that exist in the Tenant model and should be synced
        $tenantFields = [
            'company_name',
            'legal_form',
            'managing_director',
            'address_street',
            'address_house_no',
            'address_zip',
            'address_city',
            'address_country',
            'phone',
            'email',
            'website',
            'opening_hours',
            'tax_number',
            'vat_id',
            'tax_office',
            'bank_name',
            'bank_iban',
            'bank_bic',
            'bank_code',
            'bank_account_holder',
            'domain'
        ];

        $tenantUpdateData = [];

        foreach ($validated as $key => $value) {
            // Update settings table (primary EAV storage)
            \App\Models\TenantSetting::updateOrCreate(
                ['tenant_id' => $tenantId, 'key' => $key],
                ['value' => $value]
            );

            // If it's a field in the tenant model, prepare for sync
            if (in_array($key, $tenantFields)) {
                $tenantUpdateData[$key] = $value;
            }
        }

        // Sync back to tenant model for GoBD snapshots (InvoiceController reads from Tenant model)
        if ($tenant) {
            if (!empty($tenantUpdateData)) {
                $tenant->update($tenantUpdateData);
            }

            // Handle logo specifically
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('tenant_logos', 'public');
                $tenantSettings = $tenant->settings ?? [];
                $tenantSettings['company_logo'] = $path;
                $tenant->settings = $tenantSettings;
                $tenant->save();

                // Also save to settings table for consistency
                \App\Models\TenantSetting::updateOrCreate(
                    ['tenant_id' => $tenantId, 'key' => 'company_logo'],
                    ['value' => $path]
                );
            }
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|image|max:4096',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);

        $path = $request->file('logo')->store('tenant_logos', 'public');

        // Save to tenant model
        if ($tenant) {
            $tenantSettings = $tenant->settings ?? [];
            $tenantSettings['company_logo'] = $path;
            $tenant->settings = $tenantSettings;
            $tenant->save();
        }

        // Save to settings table
        \App\Models\TenantSetting::updateOrCreate(
            ['tenant_id' => $tenantId, 'key' => 'company_logo'],
            ['value' => $path]
        );

        return response()->json(['message' => 'Logo hochgeladen', 'path' => $path]);
    }

    public function deleteLogo(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);

        // Remove from tenant model
        if ($tenant) {
            $tenantSettings = $tenant->settings ?? [];
            if (isset($tenantSettings['company_logo'])) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($tenantSettings['company_logo']);
                unset($tenantSettings['company_logo']);
                $tenant->settings = $tenantSettings;
                $tenant->save();
            }
        }

        // Remove from settings table
        \App\Models\TenantSetting::where('tenant_id', $tenantId)
            ->where('key', 'company_logo')
            ->delete();

        return response()->json(['message' => 'Logo entfernt']);
    }

    public function testMailConnection(Request $request)
    {
        $validated = $request->validate([
            'mail_host' => 'required|string',
            'mail_port' => 'required|string',
            'mail_username' => 'required|string',
            'mail_password' => 'required|string',
            'mail_encryption' => 'nullable|string',
        ]);

        $results = [
            'smtp' => ['success' => false, 'message' => 'Nicht getestet'],
            'imap' => ['success' => false, 'message' => 'Nicht getestet']
        ];

        $encryption = $validated['mail_encryption'] ?? 'ssl';
        $smtpPort = (int) $validated['mail_port'];

        // Auto-detect SMTP port if user accidentally entered IMAP port
        if ($smtpPort === 993 || $smtpPort === 995) {
            $smtpPort = ($encryption === 'ssl') ? 465 : 587;
        }

        // 1. Test SMTP
        try {
            // Use smtps:// for SSL (port 465), smtp:// for TLS/STARTTLS (port 587)
            $scheme = ($encryption === 'ssl' || $smtpPort === 465) ? 'smtps' : 'smtp';

            $dsn = sprintf(
                '%s://%s:%s@%s:%d',
                $scheme,
                urlencode($validated['mail_username']),
                urlencode($validated['mail_password']),
                $validated['mail_host'],
                $smtpPort
            );

            $transport = \Symfony\Component\Mailer\Transport::fromDsn($dsn);
            $mailer = new \Symfony\Component\Mailer\Mailer($transport);

            $email = (new \Symfony\Component\Mime\Email())
                ->from($validated['mail_username'])
                ->to($validated['mail_username'])
                ->subject('Translation Office – Verbindungstest')
                ->text('Diese E-Mail bestätigt, dass Ihre SMTP-Einstellungen korrekt sind.');

            $mailer->send($email);
            $results['smtp'] = [
                'success' => true,
                'message' => "SMTP Verbindung erfolgreich über {$scheme}://...:{$smtpPort} (Test-Mail gesendet)."
            ];
        } catch (\Exception $e) {
            $results['smtp'] = [
                'success' => false,
                'message' => 'SMTP Fehler (' . $validated['mail_host'] . ':' . $smtpPort . '): ' . $e->getMessage()
            ];
        }

        // 2. Test IMAP
        try {
            // IMAP uses port 993 for SSL, 143 for TLS/none
            $imapPort = ($encryption === 'ssl') ? 993 : 143;
            $imapEncryption = ($encryption === 'ssl') ? 'ssl' : ($encryption === 'none' ? false : 'tls');

            $client = \Webklex\IMAP\Facades\Client::make([
                'host' => $validated['mail_host'],
                'port' => $imapPort,
                'encryption' => $imapEncryption,
                'validate_cert' => false,
                'username' => $validated['mail_username'],
                'password' => $validated['mail_password'],
                'protocol' => 'imap'
            ]);

            $client->connect();
            $results['imap'] = [
                'success' => true,
                'message' => "IMAP Verbindung erfolgreich über Port {$imapPort}."
            ];
        } catch (\Exception $e) {
            $results['imap'] = [
                'success' => false,
                'message' => 'IMAP Fehler: ' . $e->getMessage()
            ];
        }

        return response()->json($results);
    }
}
