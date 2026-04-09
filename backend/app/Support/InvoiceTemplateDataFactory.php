<?php

namespace App\Support;

use App\Models\Invoice as AppInvoice;
use App\Models\Tenant;

class InvoiceTemplateDataFactory
{
    public static function build(AppInvoice $invoice, ?Tenant $tenant, array $settings = []): array
    {
        $companyName = $tenant->company_name ?? $tenant->name ?? ($settings['company_name'] ?? 'Firma');
        $street = trim(($tenant->address_street ?? ($settings['address_street'] ?? '')) . ' ' . ($tenant->address_house_no ?? ''));
        $zip = $tenant->address_zip ?? ($settings['address_zip'] ?? '');
        $city = $tenant->address_city ?? ($settings['address_city'] ?? '');
        $country = $tenant->address_country ?? ($settings['address_country'] ?? 'Deutschland');
        $fullAddressLine = trim(implode(' · ', array_filter([$street, trim($zip . ' ' . $city), $country])));

        $tenantSettings = $tenant ? ($tenant->getAttribute('settings') ?? []) : [];
        $logoPath = $settings['company_logo'] ?? (($tenantSettings['company_logo'] ?? null));
        $logoFullPath = $logoPath ? storage_path('app/public/' . $logoPath) : null;
        $logoBase64 = null;

        if ($logoFullPath && file_exists($logoFullPath)) {
            $logoBase64 = 'data:image/' . pathinfo($logoFullPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoFullPath));
        }

        $isCreditNote = $invoice->type === AppInvoice::TYPE_CREDIT_NOTE;
        $docTypeLabel = $isCreditNote ? 'Gutschrift' : 'Rechnung';
        $paidAmount = (float) ($invoice->paid_amount_eur ?? 0);
        $grossAmount = (float) ($invoice->amount_gross_eur ?? 0);
        $dueAmount = max(0, $grossAmount - $paidAmount);
        $taxRate = (float) ($invoice->tax_rate ?? 19);
        $isTaxExempt = in_array($invoice->tax_exemption, [AppInvoice::TAX_SMALL_BUSINESS, AppInvoice::TAX_REVERSE_CHARGE], true)
            || (float) ($invoice->amount_tax_eur ?? 0) <= 0.00001;

        $defaultIntro = $isCreditNote
            ? 'hiermit erhalten Sie die nachfolgend aufgefuehrte Gutschrift.'
            : 'wir berechnen Ihnen die nachfolgend aufgefuehrten Leistungen wie vereinbart.';

        $defaultClosing = $dueAmount > 0
            ? 'Bitte ueberweisen Sie den offenen Betrag unter Angabe der Dokumentnummer fristgerecht auf das unten genannte Konto.'
            : 'Der Rechnungsbetrag ist bereits ausgeglichen. Vielen Dank.';

        return [
            'company' => [
                'name' => $companyName,
                'street' => $street,
                'zip' => $zip,
                'city' => $city,
                'country' => $country,
                'full_address_line' => $fullAddressLine,
                'email' => $tenant->email ?? ($settings['email'] ?? ($settings['company_email'] ?? '')),
                'phone' => $tenant->phone ?? ($settings['phone'] ?? ''),
                'website' => $tenant->website ?? ($settings['website'] ?? ''),
                'legal_form' => $tenant->legal_form ?? ($settings['legal_form'] ?? ''),
                'managing_director' => $tenant->managing_director ?? ($settings['managing_director'] ?? ''),
                'tax_office' => $tenant->tax_office ?? ($settings['tax_office'] ?? ''),
                'tax_number' => $tenant->tax_number ?? ($settings['tax_number'] ?? ''),
                'vat_id' => $tenant->vat_id ?? ($settings['vat_id'] ?? ''),
                'bank_name' => $tenant->bank_name ?? ($settings['bank_name'] ?? ''),
                'iban' => $tenant->bank_iban ?? ($settings['bank_iban'] ?? ''),
                'bic' => $tenant->bank_bic ?? ($settings['bank_bic'] ?? ''),
                'bank_account_holder' => $tenant->bank_account_holder ?? ($settings['bank_account_holder'] ?? $companyName),
                'logo_base64' => $logoBase64,
            ],
            'layout' => [
                'font_family' => $settings['invoice_font_family'] ?? 'Helvetica, Arial, sans-serif',
                'font_size' => $settings['invoice_font_size'] ?? '9pt',
                'primary_color' => $settings['invoice_primary_color'] ?? '#16324f',
            ],
            'document' => [
                'type_label' => $docTypeLabel,
                'number' => $invoice->invoice_number,
                'date' => optional($invoice->date)->format('d.m.Y'),
                'due_date' => optional($invoice->due_date)->format('d.m.Y'),
                'delivery_date' => optional($invoice->delivery_date)->format('d.m.Y'),
                'service_period' => $invoice->service_period,
                'customer_number' => $invoice->customer_id,
                'project_number' => $invoice->snapshot_project_number,
                'project_name' => $invoice->snapshot_project_name,
                'order_reference' => $invoice->order_reference,
                'buyer_reference' => $invoice->buyer_reference,
                'payment_reference' => $invoice->payment_reference ?: $invoice->invoice_number,
                'leitweg_id' => $invoice->snapshot_customer_leitweg_id,
                'is_credit_note' => $isCreditNote,
                'is_tax_exempt' => $isTaxExempt,
                'tax_exemption' => $invoice->tax_exemption,
                'tax_rate' => $taxRate,
                'intro_text' => trim($invoice->intro_text ?: ($settings[$isCreditNote ? 'credit_note_intro_text' : 'invoice_intro_text'] ?? $defaultIntro)),
                'closing_text' => trim($invoice->footer_text ?: ($settings['invoice_closing_text'] ?? $defaultClosing)),
                'notes' => trim((string) $invoice->notes),
            ],
            'amounts' => [
                'net' => (float) ($invoice->amount_net_eur ?? 0),
                'tax' => (float) ($invoice->amount_tax_eur ?? 0),
                'gross' => $grossAmount,
                'shipping' => (float) ($invoice->shipping_eur ?? 0),
                'discount' => (float) ($invoice->discount_eur ?? 0),
                'paid' => $paidAmount,
                'due' => $dueAmount,
            ],
            'recipient' => [
                'salutation' => $invoice->snapshot_customer_salutation,
                'name' => $invoice->snapshot_customer_name,
                'address_lines' => array_values(array_filter([
                    $invoice->snapshot_customer_address,
                    trim(($invoice->snapshot_customer_zip ?? '') . ' ' . ($invoice->snapshot_customer_city ?? '')),
                    $invoice->snapshot_customer_country,
                ])),
                'vat_id' => $invoice->snapshot_customer_vat_id,
            ],
        ];
    }
}
