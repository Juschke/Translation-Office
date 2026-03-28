const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add reports chart labels
en.reports = en.reports || {};
de.reports = de.reports || {};

const reportKeys = {
  'revenue_label': { en: 'Revenue', de: 'Umsatz' },
  'margin_label': { en: 'Margin', de: 'Marge' },
  'profit_label': { en: 'Profit', de: 'Gewinn' },
  'tax_report': { en: 'Tax Report', de: 'Steuerbericht' },
  'profitability': { en: 'Profitability', de: 'Rentabilität' },
  'opos': { en: 'OPOS Report', de: 'OPOS-Bericht' },
  'bwa': { en: 'BWA Report', de: 'BWA-Bericht' },
  'analytics': { en: 'Analytics', de: 'Analysen' },
  'finance': { en: 'Finance', de: 'Finanzen' },
  'invoice_issued': { en: 'Issued', de: 'Ausgestellt' },
  'invoice_overdue': { en: 'Overdue', de: 'Überfällig' }
};

Object.keys(reportKeys).forEach(key => {
  en.reports[key] = reportKeys[key].en;
  de.reports[key] = reportKeys[key].de;
});

// Add document format keys
en.documents = en.documents || {};
de.documents = de.documents || {};

const docKeys = {
  'format_source': { en: 'Source (Input)', de: 'Eingang (Source)' },
  'format_target': { en: 'Target (Output)', de: 'Ausspielung (Target)' },
  'format_pdf': { en: 'PDF', de: 'PDF' },
  'format_word': { en: 'Word (DOCX)', de: 'Word (DOCX)' },
  'format_excel': { en: 'Excel (XLSX)', de: 'Excel (XLSX)' },
  'format_zip': { en: 'Archive (ZIP)', de: 'Archive (ZIP)' }
};

Object.keys(docKeys).forEach(key => {
  en.documents[key] = docKeys[key].en;
  de.documents[key] = docKeys[key].de;
});

// Add inbox variable labels
en.inbox = en.inbox || {};
de.inbox = de.inbox || {};

const inboxKeys = {
  'var_customer_name': { en: 'Customer Name', de: 'Kundenname' },
  'var_contact_person': { en: 'Contact Person', de: 'Ansprechpartner' },
  'var_customer_email': { en: 'Customer Email', de: 'Kunden-E-Mail' },
  'var_customer_phone': { en: 'Phone', de: 'Telefon' },
  'var_customer_address': { en: 'Address', de: 'Adresse' },
  'var_customer_city': { en: 'City', de: 'Stadt' },
  'var_customer_zip': { en: 'ZIP Code', de: 'PLZ' },
  'var_project_number': { en: 'Project Number', de: 'Projektnummer' },
  'var_project_name': { en: 'Project Name', de: 'Projektname' },
  'var_project_status': { en: 'Status', de: 'Status' },
  'var_source_language': { en: 'Source Language', de: 'Ausgangssprache' },
  'var_target_language': { en: 'Target Language', de: 'Zielsprache' },
  'var_project_languages': { en: 'Language Pair', de: 'Sprachpaar' },
  'var_deadline': { en: 'Deadline', de: 'Deadline' },
  'var_created_at': { en: 'Created', de: 'Erstellt' },
  'var_total_amount': { en: 'Total Amount', de: 'Gesamtbetrag' },
  'var_partner_name': { en: 'Partner Name', de: 'Partnername' },
  'var_partner_type': { en: 'Partner Type', de: 'Partnertyp' },
  'var_partner_email': { en: 'Partner Email', de: 'Partner-E-Mail' },
  'var_partner_phone': { en: 'Partner Phone', de: 'Partner-Telefon' },
  'var_company_name': { en: 'Company Name', de: 'Firmenname' },
  'var_company_phone': { en: 'Company Phone', de: 'Firmentelefon' },
  'var_company_email': { en: 'Company Email', de: 'Firmen-E-Mail' },
  'var_current_date': { en: 'Current Date', de: 'Aktuelles Datum' },
  'var_sender': { en: 'Sender', de: 'Absender' }
};

Object.keys(inboxKeys).forEach(key => {
  en.inbox[key] = inboxKeys[key].en;
  de.inbox[key] = inboxKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Reports, documents, and inbox keys added!');
