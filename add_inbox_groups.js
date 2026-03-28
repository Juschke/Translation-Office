const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add variable group keys
en.inbox = en.inbox || {};
de.inbox = de.inbox || {};

const groupKeys = {
  'group_customer': { en: 'Customer', de: 'Kunde' },
  'group_project': { en: 'Project', de: 'Projekt' },
  'group_finance': { en: 'Finance', de: 'Finanzen' },
  'group_partner': { en: 'Partner', de: 'Partner' },
  'group_company': { en: 'Company', de: 'Unternehmen' },
  'group_general': { en: 'General', de: 'Allgemein' }
};

Object.keys(groupKeys).forEach(key => {
  en.inbox[key] = groupKeys[key].en;
  de.inbox[key] = groupKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Inbox variable group keys added!');
