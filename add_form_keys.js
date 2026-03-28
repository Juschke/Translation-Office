const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add register-specific keys
const newKeys = {
  'full_name': { en: 'Full Name', de: 'Vollständiger Name' },
  'email_address': { en: 'Email Address', de: 'E-Mail-Adresse' },
  'get_started': { en: 'Get started with Translation Office in minutes.', de: 'Starten Sie in wenigen Minuten mit Translator Office.' },
  'already_have_account': { en: 'Already have an account?', de: 'Haben Sie bereits ein Konto?' },
  'creating': { en: 'Creating...', de: 'Erstellen...' },
  'password': { en: 'Password', de: 'Passwort' }
};

Object.keys(newKeys).forEach(key => {
  en.auth[key] = newKeys[key].en;
  de.auth[key] = newKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Form translation keys added!');
