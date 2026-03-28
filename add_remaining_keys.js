const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add billing plan keys
en.billing = en.billing || {};
de.billing = de.billing || {};
const billingKeys = {
  'standard': { en: 'Standard', de: 'Standard' },
  'professional': { en: 'Professional', de: 'Professional' },
  'premium': { en: 'Premium', de: 'Premium' },
  'enterprise': { en: 'Enterprise', de: 'Enterprise' },
  'custom_price': { en: 'Custom', de: 'Custom' },
  'up_to_50_projects': { en: 'Up to 50 projects', de: 'Bis zu 50 Projekte' },
  'team_members': { en: '3 team members', de: '3 Team-Mitglieder' },
  'standard_support': { en: 'Standard Support', de: 'Standard Support' },
  'basic_features': { en: 'Basic features', de: 'Basisfunktionen' },
  'choose_plan': { en: 'Choose', de: 'Wählen' }
};

Object.keys(billingKeys).forEach(key => {
  en.billing[key] = billingKeys[key].en;
  de.billing[key] = billingKeys[key].de;
});

// Add customer type keys
en.customers = en.customers || {};
de.customers = de.customers || {};
const customerKeys = {
  'type_company': { en: 'Company', de: 'Firma' },
  'type_private': { en: 'Private', de: 'Privat' },
  'type_authority': { en: 'Authority', de: 'Behörde' },
  'private_customer': { en: 'Private Customer', de: 'Privatkunde' }
};

Object.keys(customerKeys).forEach(key => {
  en.customers[key] = customerKeys[key].en;
  de.customers[key] = customerKeys[key].de;
});

// Add calendar/project keys
en.projects = en.projects || {};
de.projects = de.projects || {};
const projectKeys = {
  'priority_express': { en: '⚡ Express', de: '⚡ Express' },
  'priority_standard': { en: 'Standard', de: 'Standard' },
  'document_output': { en: 'Output', de: 'Ausspielung' },
  'document_input': { en: 'Input', de: 'Eingang' },
  'system_uploader': { en: 'System', de: 'System' }
};

Object.keys(projectKeys).forEach(key => {
  en.projects[key] = projectKeys[key].en;
  de.projects[key] = projectKeys[key].de;
});

// Add country keys
en.countries = en.countries || {};
de.countries = de.countries || {};
const countryKeys = {
  'de': { en: 'Germany', de: 'Deutschland' },
  'at': { en: 'Austria', de: 'Österreich' },
  'ch': { en: 'Switzerland', de: 'Schweiz' }
};

Object.keys(countryKeys).forEach(key => {
  en.countries[key] = countryKeys[key].en;
  de.countries[key] = countryKeys[key].de;
});

// Add status keys if not present
if (!en.status.active) {
  en.status.active = 'Active';
  de.status.active = 'Aktiv';
  en.status.inactive = 'Inactive';
  de.status.inactive = 'Inaktiv';
  en.status.archived = 'Archived';
  de.status.archived = 'Archiviert';
  en.status.deleted = 'Deleted';
  de.status.deleted = 'Gelöscht';
}

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ All remaining keys added!');
