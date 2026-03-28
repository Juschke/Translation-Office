const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Customer types
en.customers = en.customers || {};
de.customers = de.customers || {};

const customerTypes = {
  'type_company_label': { en: 'Company', de: 'Firma' },
  'type_authority_label': { en: 'Authority', de: 'Behörde' },
  'type_private_label': { en: 'Private', de: 'Privat' }
};

Object.keys(customerTypes).forEach(key => {
  en.customers[key] = customerTypes[key].en;
  de.customers[key] = customerTypes[key].de;
});

// Partner types
en.partners = en.partners || {};
de.partners = de.partners || {};

const partnerTypes = {
  'type_translator': { en: 'Translator', de: 'Übersetzer' },
  'type_interpreter': { en: 'Interpreter', de: 'Dolmetscher' },
  'type_agency': { en: 'Agency', de: 'Agentur' },
  'type_trans_interp': { en: 'Translator & Interpreter', de: 'Übersetzer & Dolmetscher' },
  'type_unknown': { en: 'Not specified', de: 'Keine Angabe' }
};

Object.keys(partnerTypes).forEach(key => {
  en.partners[key] = partnerTypes[key].en;
  de.partners[key] = partnerTypes[key].de;
});

// Add project priority labels
en.projects = en.projects || {};
de.projects = de.projects || {};

const priorityKeys = {
  'priority_standard': { en: 'Standard', de: 'Standard' },
  'priority_urgent': { en: 'Urgent', de: 'Dringend' },
  'priority_express': { en: 'Express', de: 'Express' },
  'project_creating': { en: 'Creating...', de: 'Speichert...' },
  'project_updating': { en: 'Updating...', de: 'Aktualisiert...' },
  'create_project': { en: 'Create Project', de: 'Projekt Anlegen' },
  'update_project': { en: 'Update Project', de: 'Projekt Aktualisieren' }
};

Object.keys(priorityKeys).forEach(key => {
  en.projects[key] = priorityKeys[key].en;
  de.projects[key] = priorityKeys[key].de;
});

// Add inbox sync labels
en.inbox = en.inbox || {};
de.inbox = de.inbox || {};

const inboxKeys = {
  'sync_syncing': { en: 'Syncing...', de: 'Sync...' },
  'sync_fetch': { en: 'Fetch', de: 'Abrufen' },
  'template_general': { en: 'General', de: 'Allgemein' }
};

Object.keys(inboxKeys).forEach(key => {
  en.inbox[key] = inboxKeys[key].en;
  de.inbox[key] = inboxKeys[key].de;
});

// Add profile labels
en.profile = en.profile || {};
de.profile = de.profile || {};

const profileKeys = {
  'verified': { en: 'Verified', de: 'Verifiziert' },
  'unverified': { en: 'Unverified', de: 'Unverifiziert' }
};

Object.keys(profileKeys).forEach(key => {
  en.profile[key] = profileKeys[key].en;
  de.profile[key] = profileKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Customer, partner, project, inbox, and profile keys added!');
