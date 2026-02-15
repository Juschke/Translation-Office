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

        // Fields that exist in the Tenant model and should be synced
        $tenantFields = [
            'company_name', 'legal_form', 'address_street', 'address_house_no', 
            'address_zip', 'address_city', 'address_country', 'tax_number', 
            'vat_id', 'bank_name', 'bank_iban', 'bank_bic', 'domain'
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
        if ($tenant && !empty($tenantUpdateData)) {
            $tenant->update($tenantUpdateData);
        }

        return response()->json(['message' => 'Settings updated successfully']);
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
                'host'          => $validated['mail_host'],
                'port'          => $imapPort,
                'encryption'    => $imapEncryption,
                'validate_cert' => false,
                'username'      => $validated['mail_username'],
                'password'      => $validated['mail_password'],
                'protocol'      => 'imap'
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
