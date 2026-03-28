const fs = require('fs');

const file = '/home/oem/Desktop/Translation-Office/frontend/src/pages/Inbox.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace variable labels with t() function calls
const replacements = [
  ["label: 'Kundenname'", "label: t('inbox.var_customer_name')"],
  ["label: 'Ansprechpartner'", "label: t('inbox.var_contact_person')"],
  ["label: 'Kunden-E-Mail'", "label: t('inbox.var_customer_email')"],
  ["label: 'Telefon'", "label: t('inbox.var_customer_phone')"],
  ["label: 'Adresse'", "label: t('inbox.var_customer_address')"],
  ["label: 'Stadt'", "label: t('inbox.var_customer_city')"],
  ["label: 'PLZ'", "label: t('inbox.var_customer_zip')"],
  ["label: 'Projektnummer'", "label: t('inbox.var_project_number')"],
  ["label: 'Projektname'", "label: t('inbox.var_project_name')"],
  ["label: 'Status'", "label: t('inbox.var_project_status')"],
  ["label: 'Ausgangssprache'", "label: t('inbox.var_source_language')"],
  ["label: 'Zielsprache'", "label: t('inbox.var_target_language')"],
  ["label: 'Sprachpaar'", "label: t('inbox.var_project_languages')"],
  ["label: 'Deadline'", "label: t('inbox.var_deadline')"],
  ["label: 'Erstellt'", "label: t('inbox.var_created_at')"],
  ["label: 'Gesamtbetrag'", "label: t('inbox.var_total_amount')"],
  ["label: 'Partnername'", "label: t('inbox.var_partner_name')"],
  ["label: 'Partnertyp'", "label: t('inbox.var_partner_type')"],
  ["label: 'Partner-E-Mail'", "label: t('inbox.var_partner_email')"],
  ["label: 'Partner-Telefon'", "label: t('inbox.var_partner_phone')"],
  ["label: 'Firmenname'", "label: t('inbox.var_company_name')"],
  ["label: 'Firmentelefon'", "label: t('inbox.var_company_phone')"],
  ["label: 'Firmen-E-Mail'", "label: t('inbox.var_company_email')"],
  ["label: 'Aktuelles Datum'", "label: t('inbox.var_current_date')"],
  ["label: 'Absender'", "label: t('inbox.var_sender')"],
];

replacements.forEach(([old, newVal]) => {
  content = content.replace(new RegExp(old.replace(/'/g, "'"), 'g'), newVal);
});

fs.writeFileSync(file, content);
console.log('✓ Inbox variables translated!');
