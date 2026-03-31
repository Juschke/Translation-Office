/**
 * templateUtils.ts
 *
 * Utility functions for email template variable substitution and preview.
 * Variables use {{variable_name}} format (single-brace {variable_name} also accepted).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VariableGroup = 'firma' | 'absender' | 'projekt' | 'datum';

export interface TemplateVariableDescriptor {
    key: string;
    label: string;
    group: VariableGroup;
    /** Realistic example value shown in the preview */
    example: string;
}

// ---------------------------------------------------------------------------
// Variable catalogue
// ---------------------------------------------------------------------------

const VARIABLE_DESCRIPTORS: TemplateVariableDescriptor[] = [
    // --- Firma ---
    { key: 'company_name',      label: 'Unternehmensname',          group: 'firma',    example: 'Muster Übersetzungen GmbH' },
    { key: 'company_email',     label: 'Unternehmens-E-Mail',        group: 'firma',    example: 'info@muster-uebersetzungen.de' },
    { key: 'company_phone',     label: 'Unternehmenstelefon',        group: 'firma',    example: '+49 89 1234567' },
    { key: 'company_website',   label: 'Unternehmens-Website',       group: 'firma',    example: 'www.muster-uebersetzungen.de' },
    { key: 'company_address',   label: 'Unternehmensadresse',        group: 'firma',    example: 'Musterstraße 12, 80331 München' },
    { key: 'managing_director', label: 'Geschäftsführer/in',         group: 'firma',    example: 'Anna Müller' },
    { key: 'bank_name',         label: 'Bankname',                   group: 'firma',    example: 'Commerzbank AG' },
    { key: 'bank_iban',         label: 'IBAN',                       group: 'firma',    example: 'DE89 3704 0044 0532 0130 00' },
    { key: 'bank_bic',          label: 'BIC',                        group: 'firma',    example: 'COBADEFFXXX' },
    { key: 'bank_holder',       label: 'Kontoinhaber',               group: 'firma',    example: 'Muster Übersetzungen GmbH' },
    { key: 'vat_id',            label: 'Umsatzsteuer-ID',            group: 'firma',    example: 'DE123456789' },
    { key: 'tax_id',            label: 'Steuernummer',               group: 'firma',    example: '143/234/12345' },

    // --- Absender ---
    { key: 'sender_name',       label: 'Absendername',               group: 'absender', example: 'Max Mustermann' },
    { key: 'sender_email',      label: 'Absender-E-Mail',            group: 'absender', example: 'max.mustermann@muster-uebersetzungen.de' },

    // --- Projekt ---
    { key: 'customer_name',     label: 'Kundenname',                 group: 'projekt',  example: 'Mustermann GmbH' },
    { key: 'contact_person',    label: 'Kontaktperson',              group: 'projekt',  example: 'Thomas Schmidt' },
    { key: 'customer_email',    label: 'Kunden-E-Mail',              group: 'projekt',  example: 'thomas.schmidt@mustermann.de' },
    { key: 'project_number',    label: 'Projektnummer',              group: 'projekt',  example: 'P-2024-0042' },
    { key: 'project_name',      label: 'Projektname',                group: 'projekt',  example: 'Vertragsdokument DE→EN' },
    { key: 'project_status',    label: 'Projektstatus',              group: 'projekt',  example: 'In Bearbeitung' },
    { key: 'source_language',   label: 'Ausgangssprache',            group: 'projekt',  example: 'Deutsch' },
    { key: 'target_language',   label: 'Zielsprache',                group: 'projekt',  example: 'Englisch' },
    { key: 'deadline',          label: 'Abgabetermin',               group: 'projekt',  example: '30.04.2024' },
    { key: 'document_type',     label: 'Dokumentart',                group: 'projekt',  example: 'Vertrag' },
    { key: 'priority',          label: 'Priorität',                  group: 'projekt',  example: 'Standard' },
    { key: 'price_net',         label: 'Nettobetrag',                group: 'projekt',  example: '420,00 €' },
    { key: 'price_gross',       label: 'Bruttobetrag',               group: 'projekt',  example: '499,80 €' },
    { key: 'payment_terms',     label: 'Zahlungsziel',               group: 'projekt',  example: '14 Tage' },
    { key: 'invoice_number',    label: 'Rechnungsnummer',            group: 'projekt',  example: 'RE-2024-0042' },
    { key: 'invoice_date',      label: 'Rechnungsdatum',             group: 'projekt',  example: '01.04.2024' },
    { key: 'due_date',          label: 'Fälligkeitsdatum',           group: 'projekt',  example: '15.04.2024' },
    { key: 'partner_name',      label: 'Partnername',                group: 'projekt',  example: 'Carla Berthold' },
    { key: 'partner_email',     label: 'Partner-E-Mail',             group: 'projekt',  example: 'carla.berthold@freelance.de' },

    // --- Datum ---
    { key: 'date',              label: 'Aktuelles Datum',            group: 'datum',    example: new Date().toLocaleDateString('de-DE') },
];

/** Returns all supported variable descriptors. */
export function getTemplateVariables(): TemplateVariableDescriptor[] {
    return VARIABLE_DESCRIPTORS;
}

// ---------------------------------------------------------------------------
// Substitution
// ---------------------------------------------------------------------------

/**
 * Replaces {{variable_name}} and {variable_name} patterns in `template`.
 *
 * - Known variables are replaced with the corresponding value from `variables`.
 * - Unknown placeholders are left untouched so the caller can highlight them.
 *
 * @param template  Raw template string (may contain HTML)
 * @param variables Map of variable key → replacement value
 * @returns         String with known placeholders replaced
 */
export function substituteVariables(
    template: string,
    variables: Record<string, string>,
): string {
    if (!template) return '';

    // Build a set of all known keys for fast lookup
    const knownKeys = new Set(VARIABLE_DESCRIPTORS.map(d => d.key));
    // Also include any extra keys supplied by the caller
    Object.keys(variables).forEach(k => knownKeys.add(k));

    return template.replace(/\{\{?(\w+)\}?\}/g, (match, key) => {
        if (key in variables) return variables[key];
        if (knownKeys.has(key)) return variables[key] ?? match;
        return match; // unknown variable — leave as-is
    });
}

// ---------------------------------------------------------------------------
// Example-value map (for preview rendering)
// ---------------------------------------------------------------------------

/**
 * Returns a Record<string, string> of all variable keys mapped to their
 * realistic example values, ready to pass into `substituteVariables`.
 */
export function getExampleVariableMap(): Record<string, string> {
    const map: Record<string, string> = {};
    VARIABLE_DESCRIPTORS.forEach(d => {
        map[d.key] = d.example;
    });
    return map;
}

// ---------------------------------------------------------------------------
// Unreplaced placeholder detection
// ---------------------------------------------------------------------------

/**
 * Returns an array of all placeholder keys (both {{x}} and {x} variants)
 * still present in `text` after substitution.
 */
export function findUnreplacedPlaceholders(text: string): string[] {
    const found: string[] = [];
    const regex = /\{\{?(\w+)\}?\}/g;
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text)) !== null) {
        if (!found.includes(match[1])) found.push(match[1]);
    }
    return found;
}

// ---------------------------------------------------------------------------
// HTML preview with amber highlight for unreplaced placeholders
// ---------------------------------------------------------------------------

/**
 * Substitutes known example values into `html` and wraps any remaining
 * {{unknown}} / {unknown} placeholders in an amber highlight span.
 *
 * Safe to use with dangerouslySetInnerHTML after DOMPurify.sanitize().
 */
export function buildPreviewHtml(
    html: string,
    variables?: Record<string, string>,
): string {
    if (!html) return '';

    const vars = variables ?? getExampleVariableMap();
    const substituted = substituteVariables(html, vars);

    // Highlight remaining unreplaced placeholders
    return substituted.replace(
        /\{\{?(\w+)\}?\}/g,
        '<mark style="background:#fef3c7;color:#92400e;padding:0 3px;border-radius:3px;font-family:monospace;font-size:0.85em">{{$1}}</mark>',
    );
}
