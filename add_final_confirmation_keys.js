const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Confirmation messages
en.confirm = en.confirm || {};
de.confirm = de.confirm || {};

const confirmKeys = {
  'delete_payment': { en: 'Really delete this payment?', de: 'Möchten Sie diese Zahlung wirklich löschen?' },
  'delete_payment_amount': { en: 'Really delete this payment of {{amount}} €?', de: 'Möchten Sie die Zahlung in Höhe von {{amount}} € wirklich löschen?' }
};

Object.keys(confirmKeys).forEach(key => {
  en.confirm[key] = confirmKeys[key].en;
  de.confirm[key] = confirmKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Confirmation message keys added!');
