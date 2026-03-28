const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

const newKeys = {
  'delete': { en: 'Delete', de: 'Löschen' },
  'cancel': { en: 'Cancel', de: 'Abbrechen' },
  'add': { en: 'Add', de: 'Hinzufügen' },
  'save': { en: 'Save', de: 'Speichern' },
  'edit': { en: 'Edit', de: 'Bearbeiten' },
  'close': { en: 'Close', de: 'Schließen' }
};

// Add to actions section
Object.keys(newKeys).forEach(key => {
  if (!en.actions[key]) {
    en.actions[key] = newKeys[key].en;
  }
  if (!de.actions[key]) {
    de.actions[key] = newKeys[key].de;
  }
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Common action keys updated!');
