const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add table/list header keys
en.tables = en.tables || {};
de.tables = de.tables || {};

const tableKeys = {
  'id': { en: 'ID', de: 'ID' },
  'company_name': { en: 'Company/Name', de: 'Unternehmen/Name' },
  'contact_person': { en: 'Contact Person', de: 'Ansprechpartner' },
  'email': { en: 'Email', de: 'E-Mail' },
  'revenue': { en: 'Revenue', de: 'Umsatz' },
  'status': { en: 'Status', de: 'Status' },
  'partner_name': { en: 'Partner/Company', de: 'Partner/Firma' },
  'partner_type': { en: 'Type', de: 'Typ' },
  'rating': { en: 'Rating', de: 'Bewertung' },
  'project_name': { en: 'Project Name', de: 'Projektname' },
  'customer': { en: 'Customer', de: 'Kunde' },
  'source_lang': { en: 'Source', de: 'Quelle' },
  'target_lang': { en: 'Target', de: 'Ziel' },
  'deadline': { en: 'Deadline', de: 'Deadline' },
  'price': { en: 'Price', de: 'Preis' }
};

Object.keys(tableKeys).forEach(key => {
  en.tables[key] = tableKeys[key].en;
  de.tables[key] = tableKeys[key].de;
});

// Add form/template keys
en.forms = en.forms || {};
de.forms = de.forms || {};

const formKeys = {
  'create_template': { en: 'Create Template', de: 'Vorlage erstellen' },
  'current_date': { en: 'Current Date', de: 'Aktuelles Datum' },
  'sender': { en: 'Sender', de: 'Absender' }
};

Object.keys(formKeys).forEach(key => {
  en.forms[key] = formKeys[key].en;
  de.forms[key] = formKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Table and form header keys added!');
