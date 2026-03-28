const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Billing plan features
en.billing = en.billing || {};
de.billing = de.billing || {};

const billingKeys = {
  'projects': { en: 'Projects', de: 'Projekte' },
  'per_month': { en: '/ Month', de: '/ Monat' },
  'team': { en: 'Team', de: 'Team' },
  'users': { en: 'Users', de: 'User' },
  'unlimited': { en: '∞', de: '∞' }
};

Object.keys(billingKeys).forEach(key => {
  en.billing[key] = billingKeys[key].en;
  de.billing[key] = billingKeys[key].de;
});

// Team roles (already exist but ensuring translation consistency)
en.team = en.team || {};
de.team = de.team || {};

const teamKeys = {
  'role_employee': { en: 'Employee', de: 'Mitarbeiter' },
  'role_manager': { en: 'Manager', de: 'Manager' },
  'status_active': { en: 'Active', de: 'Aktiv' },
  'status_inactive': { en: 'Inactive', de: 'Inaktiv' }
};

Object.keys(teamKeys).forEach(key => {
  en.team[key] = teamKeys[key].en;
  de.team[key] = teamKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Billing and team keys added!');
