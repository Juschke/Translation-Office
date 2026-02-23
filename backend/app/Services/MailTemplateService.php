<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Models\EmailTemplate;

class MailTemplateService
{
    /**
     * Replace placeholders in a template with actual data.
     *
     * @param string $content
     * @param array $data
     * @param Tenant|null $tenant
     * @param User|null $user
     * @return string
     */
    public function parseTemplate(string $content, array $data = [], ?Tenant $tenant = null, ?User $user = null): string
    {
        $variables = $data;

        // Add Tenant variables
        if ($tenant) {
            $variables['company_name'] = $tenant->company_name ?? '';
            $variables['company_email'] = $tenant->email ?? '';
            $variables['company_phone'] = $tenant->phone ?? '';
            $variables['company_website'] = $tenant->website ?? '';
            $variables['company_address'] = trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? '') . ', ' . ($tenant->address_zip ?? '') . ' ' . ($tenant->address_city ?? ''));
            $variables['managing_director'] = $tenant->managing_director ?? '';
            $variables['bank_name'] = $tenant->bank_name ?? '';
            $variables['bank_iban'] = $tenant->bank_iban ?? '';
            $variables['bank_bic'] = $tenant->bank_bic ?? '';
            $variables['bank_holder'] = $tenant->bank_account_holder ?? '';
            $variables['tax_number'] = $tenant->tax_number ?? '';
            $variables['vat_id'] = $tenant->vat_id ?? '';
            $variables['tax_office'] = $tenant->tax_office ?? '';
        }

        // Add User (Sender) variables
        if ($user) {
            $variables['sender_name'] = $user->name ?? '';
            $variables['sender_email'] = $user->email ?? '';
        }

        // Add current date
        $variables['date'] = now()->format('d.m.Y');

        // Generate dynamic signature
        if (!isset($variables['signature'])) {
            $variables['signature'] = $this->generateDefaultSignature($tenant, $user);
        }

        // Replace all placeholders formatted as {{variable_name}} OR {variable_name}
        // Support both for backward compatibility with existing templates/db entries
        foreach ($variables as $key => $value) {
            if (is_scalar($value)) {
                $content = str_replace('{{' . $key . '}}', (string) $value, $content);
                $content = str_replace('{' . $key . '}', (string) $value, $content);
            }
        }

        return $content;
    }

    /**
     * Extracts variables from a Project model.
     */
    public function getProjectVariables(\App\Models\Project $project): array
    {
        $customer = $project->customer;
        $partner  = $project->partner;

        $customerName  = $customer
            ? ($customer->company_name ?: trim($customer->first_name . ' ' . $customer->last_name))
            : '';
        $contactPerson = $customer
            ? ($customer->contact_person ?: trim($customer->first_name . ' ' . $customer->last_name))
            : '';

        $partnerName  = $partner
            ? ($partner->company ?: trim(($partner->first_name ?? '') . ' ' . ($partner->last_name ?? '')))
            : '';

        $sourceLang = $project->sourceLanguage?->name ?? $project->source_language ?? '';
        $targetLang = $project->targetLanguage?->name ?? $project->target_language ?? '';
        $docType    = $project->documentType?->name ?? '';

        $priceNet   = (float) ($project->price_total ?? 0);
        $vatRate    = (float) ($project->tenant?->vat_rate ?? 19);
        $priceGross = $priceNet * (1 + $vatRate / 100);

        $paymentTerms = $customer?->payment_terms_days ?? $project->payment_terms_days ?? '';
        $priorityMap  = [
            'low'     => 'Standard',
            'medium'  => 'Normal',
            'high'    => 'Hohe Priorität',
            'express' => 'Express',
        ];

        return [
            // Kunde
            'customer_name'    => $this->formatValue($customerName),
            'contact_person'   => $this->formatValue($contactPerson),
            'customer_email'   => $this->formatValue($customer?->email),
            'customer_phone'   => $this->formatValue($customer?->phone),
            'customer_address' => $this->formatValue(
                trim(($customer?->address_street ?? '') . ' ' . ($customer?->address_house_no ?? ''))
            ),
            'customer_city'    => $this->formatValue($customer?->address_city),
            'customer_zip'     => $this->formatValue($customer?->address_zip),
            // Projekt
            'project_number'   => $this->formatValue($project->project_number ?? 'PRJ-' . $project->id),
            'project_name'     => $this->formatValue($project->project_name ?? $project->name),
            'project_status'   => $this->formatValue($project->status),
            'source_language'  => $this->formatValue($sourceLang),
            'target_language'  => $this->formatValue($targetLang),
            'project_languages'=> $this->formatValue($sourceLang && $targetLang ? "$sourceLang → $targetLang" : ''),
            'deadline'         => $project->deadline
                ? \Carbon\Carbon::parse($project->deadline)->format('d.m.Y H:i')
                : 'Keine Angabe',
            'document_type'    => $this->formatValue($docType),
            'priority'         => $this->formatValue($priorityMap[$project->priority ?? ''] ?? $project->priority),
            // Finanzen
            'price_net'        => number_format($priceNet, 2, ',', '.') . ' €',
            'price_gross'      => number_format($priceGross, 2, ',', '.') . ' €',
            'payment_terms'    => $paymentTerms ? $paymentTerms . ' Tage' : 'Keine Angabe',
            // Partner
            'partner_name'     => $this->formatValue($partnerName),
            'partner_email'    => $this->formatValue($partner?->email),
        ];
    }

    /**
     * Helper to return "Keine Angabe" for empty values.
     */
    protected function formatValue($value, $fallback = 'Keine Angabe'): string
    {
        $v = trim((string) $value);
        return empty($v) ? $fallback : $v;
    }

    /**
     * Generate a professional default signature based on tenant and user data.
     */
    protected function generateDefaultSignature(?Tenant $tenant, ?User $user): string
    {
        $lines = ["Mit freundlichen Grüßen,"];

        if ($user) {
            $lines[] = "";
            $lines[] = $user->name;
            $role = $user->role === 'owner' ? 'Geschäftsleitung' : ($user->role === 'manager' ? 'Projektleitung' : 'Projektmanagement');
            $lines[] = $role;
            $lines[] = "";
        }

        if ($tenant) {
            $lines[] = "";
            $lines[] = $tenant->company_name . ($tenant->legal_form ? ' ' . $tenant->legal_form : '');
            $lines[] = trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? ''));
            $lines[] = trim(($tenant->address_zip ?? '') . ' ' . ($tenant->address_city ?? ''));
            $lines[] = "";
            if ($tenant->phone)
                $lines[] = $tenant->phone;
            if ($tenant->email)
                $lines[] = $tenant->email;
            if ($tenant->website)
                $lines[] = $tenant->website;

            $lines[] = "";
            $lines[] = "Es gelten die Allgemeinen Geschäftsbedingungen in der jeweils gültigen Fassung.";
            $lines[] = "AGB (DE): " . ($tenant->website ?? 'www.translation-office.de') . "/agb";
            $lines[] = "AGB (EN): " . ($tenant->website ?? 'www.translation-office.de') . "/agb-en";

            $lines[] = "";
            if ($tenant->managing_director) {
                $lines[] = "Geschäftsführer: " . $tenant->managing_director;
            }
            $lines[] = "Sitz der Gesellschaft: " . trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? '') . ', ' . ($tenant->address_zip ?? '') . ' ' . ($tenant->address_city ?? ''));

            $lines[] = "";
            $lines[] = "Confidentiality Notice: The information in this document may be confidential. It is intended only for the use of the named recipient. If you are not the intended recipient, please notify us immediately and then delete this document.";
        } else {
            $lines[] = "Ihr Team vom Translation Office";
        }

        return implode("\n", $lines);
    }
}
