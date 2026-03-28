const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Company types
en.settings = en.settings || {};
de.settings = de.settings || {};

const companyKeys = {
  'company_type_sole': { en: 'Sole Proprietor', de: 'Einzelunternehmen' },
  'company_type_partnership': { en: 'Partnership', de: 'Personengesellschaft' },
  'company_type_llc': { en: 'LLC', de: 'GmbH' },
  'company_type_corp': { en: 'Corporation', de: 'AG' },
  'company_type_cooperative': { en: 'Cooperative', de: 'Genossenschaft' },
  'company_type_foundation': { en: 'Foundation', de: 'Stiftung' },
  'saving': { en: 'Saving...', de: 'Speichert...' },
  'save': { en: 'Save', de: 'Speichern' }
};

Object.keys(companyKeys).forEach(key => {
  en.settings[key] = companyKeys[key].en;
  de.settings[key] = companyKeys[key].de;
});

// Weekdays
en.time = en.time || {};
de.time = de.time || {};

const weekdayKeys = {
  'monday': { en: 'Monday', de: 'Montag' },
  'tuesday': { en: 'Tuesday', de: 'Dienstag' },
  'wednesday': { en: 'Wednesday', de: 'Mittwoch' },
  'thursday': { en: 'Thursday', de: 'Donnerstag' },
  'friday': { en: 'Friday', de: 'Freitag' },
  'saturday': { en: 'Saturday', de: 'Samstag' },
  'sunday': { en: 'Sunday', de: 'Sonntag' }
};

Object.keys(weekdayKeys).forEach(key => {
  en.time[key] = weekdayKeys[key].en;
  de.time[key] = weekdayKeys[key].de;
});

// Invoice settings
en.settings = en.settings || {};
de.settings = de.settings || {};

const invoiceSettingsKeys = {
  'invoice_tab_payment': { en: 'Payment Terms', de: 'Zahlungsbedingungen' },
  'invoice_tab_tax': { en: 'Tax Rates', de: 'Steuersätze' },
  'invoice_tab_texts': { en: 'Text Templates', de: 'Textvorlagen' },
  'invoice_tab_numbers': { en: 'Number Circles', de: 'Nummerkreise' },
  'invoice_tab_design': { en: 'Design', de: 'Design' },
  'payment_term_immediate': { en: 'Immediately', de: 'Sofort' },
  'payment_term_days': { en: '{{days}} Days', de: '{{days}} Tage' },
  'payment_method_bank': { en: 'Bank Transfer', de: 'Banküberweisung' },
  'payment_method_cash': { en: 'Cash', de: 'Bargeld' },
  'payment_method_check': { en: 'Check', de: 'Scheck' }
};

Object.keys(invoiceSettingsKeys).forEach(key => {
  en.settings[key] = invoiceSettingsKeys[key].en;
  de.settings[key] = invoiceSettingsKeys[key].de;
});

// Countries
en.countries = en.countries || {};
de.countries = de.countries || {};

en.countries.de = 'Germany';
de.countries.de = 'Deutschland';
en.countries.de_default = 'Germany';
de.countries.de_default = 'Deutschland';

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Company settings, weekday, and invoice settings keys added!');
