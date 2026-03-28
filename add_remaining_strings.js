const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Email labels
en.inbox = en.inbox || {};
de.inbox = de.inbox || {};

const emailKeys = {
  'delete_single': { en: 'Delete Email', de: 'E-Mail löschen' },
  'delete_multiple': { en: 'Delete {{count}} Emails', de: '{{count}} E-Mails löschen' }
};

Object.keys(emailKeys).forEach(key => {
  en.inbox[key] = emailKeys[key].en;
  de.inbox[key] = emailKeys[key].de;
});

// Password labels
en.forms = en.forms || {};
de.forms = de.forms || {};

const passwordKeys = {
  'password_masked': { en: '••••••••', de: '••••••••' },
  'password_minimum': { en: 'At least 8 characters', de: 'Mindestens 8 Zeichen' }
};

Object.keys(passwordKeys).forEach(key => {
  en.forms[key] = passwordKeys[key].en;
  de.forms[key] = passwordKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Remaining string keys added!');
