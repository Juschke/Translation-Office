/**
 * Formatiert Kunden- und Partnernamen konsistent für Dropdown-Auswahllisten.
 * Format: [ID/Präfix-Nummer] [Anrede] [Vorname] [Nachname]
 */

export const formatCustomerLabel = (c: any): string => {
    const id = c.display_id || c.customer_number || c.id?.toString() || '';
    const salutation = c.salutation || '';
    const firstName = c.first_name || '';
    const lastName = c.last_name || '';

    return `${id} ${salutation} ${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
};

export const formatPartnerLabel = (p: any): string => {
    const id = p.display_id || p.partner_number || p.id?.toString() || '';
    const salutation = p.salutation || '';
    const firstName = p.first_name || '';
    const lastName = p.last_name || '';

    return `${id} ${salutation} ${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
};
