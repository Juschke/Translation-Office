import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useEmailVariables = () => {
    const { t } = useTranslation();

    const ALL_VARIABLES = useMemo(() => [
        // Kunde
        { key: 'customer_name', label: t('inbox.var_customer_name'), desc: 'Firmen- oder Vollname des Kunden', group: t('inbox.group_customer') },
        { key: 'contact_person', label: t('inbox.var_contact_person'), desc: 'Kontaktperson beim Kunden', group: t('inbox.group_customer') },
        { key: 'customer_email', label: t('inbox.var_customer_email'), desc: 'E-Mail-Adresse des Kunden', group: t('inbox.group_customer') },
        { key: 'customer_phone', label: t('inbox.var_customer_phone'), desc: 'Telefonnummer des Kunden', group: t('inbox.group_customer') },
        { key: 'customer_address', label: t('inbox.var_customer_address'), desc: 'Straße und Hausnummer', group: t('inbox.group_customer') },
        { key: 'customer_city', label: t('inbox.var_customer_city'), desc: 'Stadt des Kunden', group: t('inbox.group_customer') },
        { key: 'customer_zip', label: t('inbox.var_customer_zip'), desc: 'Postleitzahl des Kunden', group: t('inbox.group_customer') },
        // Projekt
        { key: 'project_number', label: t('inbox.var_project_number'), desc: 'Eindeutige Projektnummer', group: t('inbox.group_project') },
        { key: 'project_name', label: t('inbox.var_project_name'), desc: 'Bezeichnung des Projekts', group: t('inbox.group_project') },
        { key: 'project_status', label: t('inbox.var_project_status'), desc: 'Aktueller Projektstatus', group: t('inbox.group_project') },
        { key: 'source_language', label: t('inbox.var_source_language'), desc: 'Ausgangssprache des Dokuments', group: t('inbox.group_project') },
        { key: 'target_language', label: t('inbox.var_target_language'), desc: 'Zielsprache des Dokuments', group: t('inbox.group_project') },
        { key: 'project_languages', label: t('inbox.var_project_languages'), desc: 'Ausgangs- und Zielsprache kombiniert', group: t('inbox.group_project') },
        { key: 'deadline', label: t('inbox.var_deadline'), desc: 'Abgabetermin des Projekts', group: t('inbox.group_project') },
        { key: 'document_type', label: t('inbox.var_document_type'), desc: 'Art des zu übersetzenden Dokuments', group: t('inbox.group_project') },
        { key: 'priority', label: t('inbox.var_priority'), desc: 'Projektpriorität (Standard / Express)', group: t('inbox.group_project') },
        // Finanzen
        { key: 'price_net', label: t('inbox.var_price_net'), desc: 'Netto-Projektbetrag', group: t('inbox.group_finance') },
        { key: 'price_gross', label: t('inbox.var_price_gross'), desc: 'Brutto-Betrag inkl. MwSt.', group: t('inbox.group_finance') },
        { key: 'payment_terms', label: t('inbox.var_payment_terms'), desc: 'Zahlungsfrist in Tagen', group: t('inbox.group_finance') },
        { key: 'invoice_number', label: t('inbox.var_invoice_number'), desc: 'Nummer der Projektrechnung', group: t('inbox.group_finance') },
        { key: 'invoice_date', label: t('inbox.var_invoice_date'), desc: 'Datum der Rechnungstellung', group: t('inbox.group_finance') },
        { key: 'due_date', label: t('inbox.var_due_date'), desc: 'Fälligkeitsdatum der Rechnung', group: t('inbox.group_finance') },
        // Partner
        { key: 'partner_name', label: t('inbox.var_partner_name'), desc: 'Name des Übersetzers / Partners', group: t('inbox.group_partner') },
        { key: 'partner_email', label: t('inbox.var_partner_email'), desc: 'E-Mail-Adresse des Partners', group: t('inbox.group_partner') },
        // Unternehmen
        { key: 'company_name', label: t('inbox.var_company_name'), desc: 'Name Ihres Unternehmens', group: t('inbox.group_company') },
        { key: 'company_address', label: t('inbox.var_company_address'), desc: 'Adresse Ihres Unternehmens', group: t('inbox.group_company') },
        { key: 'company_phone', label: t('inbox.var_company_phone'), desc: 'Telefonnummer Ihres Unternehmens', group: t('inbox.group_company') },
        { key: 'company_email', label: t('inbox.var_company_email'), desc: 'E-Mail-Adresse Ihres Unternehmens', group: t('inbox.group_company') },
        { key: 'company_website', label: t('inbox.var_company_website'), desc: 'Website Ihres Unternehmens', group: t('inbox.group_company') },
        { key: 'managing_director', label: t('inbox.var_managing_director'), desc: 'Name der Geschäftsführung', group: t('inbox.group_company') },
        { key: 'vat_id', label: t('inbox.var_vat_id'), desc: 'Umsatzsteuer-Identifikationsnummer', group: t('inbox.group_company') },
        { key: 'tax_id', label: t('inbox.var_tax_id'), desc: 'Steuernummer des Unternehmens', group: t('inbox.group_company') },
        { key: 'bank_name', label: t('inbox.var_bank_name'), desc: 'Name Ihrer Bank', group: t('inbox.group_company') },
        { key: 'bank_iban', label: t('inbox.var_bank_iban'), desc: 'IBAN Ihres Bankkontos', group: t('inbox.group_company') },
        { key: 'bank_bic', label: t('inbox.var_bank_bic'), desc: 'BIC Ihrer Bank', group: t('inbox.group_company') },
        { key: 'bank_holder', label: t('inbox.var_bank_holder'), desc: 'Name des Kontoinhabers', group: t('inbox.group_company') },
        // Allgemein
        { key: 'date', label: t('inbox.var_date'), desc: 'Heutiges Datum', group: t('inbox.group_general') },
        { key: 'sender_name', label: t('inbox.var_sender_name'), desc: 'Name des Sachbearbeiters', group: t('inbox.group_general') },
    ], [t]);

    const VAR_GROUPS = useMemo(() => [
        t('inbox.group_customer'),
        t('inbox.group_project'),
        t('inbox.group_finance'),
        t('inbox.group_partner'),
        t('inbox.group_company'),
        t('inbox.group_general')
    ], [t]);

    /**
     * Replaces variable placeholders with sample or real data for previewing.
     */
    const getPreviewHtml = (html: string, contextData?: any) => {
        if (!html) return '';

        // Context mapping for real replacement
        const statusLabels: { [key: string]: string } = {
            'draft': 'Entwurf',
            'offer': 'Angebot',
            'pending': 'Angebot',
            'in_progress': 'Bearbeitung',
            'review': 'Bearbeitung',
            'ready_for_pickup': 'Abholbereit',
            'delivered': 'Geliefert',
            'invoiced': 'Rechnung',
            'completed': 'Abgeschlossen',
            'cancelled': 'Storniert'
        };

        const data = contextData || {
            customer: { name: '[Kunde Name]', contact_person: '[Kontaktperson]', email: '[Email]', phone: '[Telefon]' },
            project_number: '[PRJ-123]',
            project_name: '[Projekt Name]',
            status: 'draft',
            source_language: { name: '[Quelle]' },
            target_language: { name: '[Ziel]' },
            deadline: null,
            document_type: { name: '[Dokumentart]' },
            priority: 'medium',
            price_total: '0.00'
        };

        const custName = data.customer?.company_name || data.customer?.name || '[Kunde]';
        const contact = data.customer?.contact_person || (data.customer?.first_name ? `${data.customer.first_name} ${data.customer.last_name}` : '[Kontaktperson]');
        const netAmount = parseFloat(data.price_total || data.total_amount || '0');
        const grossAmount = netAmount * 1.19;

        // Replace placeholders
        let result = html;

        // Kunde
        result = result.replace(/{{customer_name}}|{customer_name}/g, custName);
        result = result.replace(/{{contact_person}}|{contact_person}/g, contact);
        result = result.replace(/{{customer_email}}|{customer_email}/g, data.customer?.email || '');
        result = result.replace(/{{customer_phone}}|{customer_phone}/g, data.customer?.phone || '');

        // Projekt
        result = result.replace(/{{project_number}}|{project_number}/g, data.project_number || 'PRJ-XXXX');
        result = result.replace(/{{project_name}}|{project_name}/g, data.project_name || data.name || '[Projekt]');
        result = result.replace(/{{project_status}}|{project_status}/g, statusLabels[data.status] || data.status || 'Entwurf');
        result = result.replace(/{{source_language}}|{source_language}/g, data.source_language?.name || '[Quelle]');
        result = result.replace(/{{target_language}}|{target_language}/g, data.target_language?.name || '[Ziel]');
        result = result.replace(/{{deadline}}|{deadline}/g, data.deadline ? new Date(data.deadline).toLocaleDateString('de-DE') : 'DD.MM.YYYY');

        // Finanzen
        result = result.replace(/{{price_net}}|{price_net}/g, `${netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`);
        result = result.replace(/{{price_gross}}|{price_gross}/g, `${grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`);

        // Placeholder fallback for standard labels if no data
        ALL_VARIABLES.forEach(v => {
            if (!contextData) {
                const regex = new RegExp(`{{${v.key}}}|{${v.key}}`, 'g');
                result = result.replace(regex, `[${v.label}]`);
            }
        });

        return result;
    };

    return {
        ALL_VARIABLES,
        VAR_GROUPS,
        getPreviewHtml
    };
};
