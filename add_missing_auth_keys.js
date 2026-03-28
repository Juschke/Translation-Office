const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

const newKeys = {
  'sign_in': { en: 'Sign In', de: 'Anmelden' },
  'sign_up': { en: 'Sign Up', de: 'Konto erstellen' },
  'create_free_account': { en: 'Create Free Account', de: 'Kostenloses Konto erstellen' },
  'password': { en: 'Password', de: 'Passwort' },
  'new_password': { en: 'New Password', de: 'Neues Passwort' },
  'confirm_password_label': { en: 'Confirm Password', de: 'Passwort bestätigen' },
  'save_password': { en: 'Save Password', de: 'Passwort speichern' },
  'forgot_password_link': { en: 'Forgot password?', de: 'Passwort vergessen?' },
  'verifying': { en: 'Verifying...', de: 'Verifiziere...' },
  'confirming': { en: 'Confirm', de: 'Bestätigen' },
  'signing_in': { en: 'Signing in...', de: 'Anmelden...' },
  'saving': { en: 'Saving...', de: 'Speichern...' },
  'delete_account': { en: 'Delete Account', de: 'Konto löschen' },
  'account_deleted': { en: 'Account deleted', de: 'Konto gelöscht' },
  'error_deleting_account': { en: 'Error deleting account', de: 'Fehler beim Löschen des Kontos' },
  'error_deleting_template': { en: 'Error deleting template', de: 'Fehler beim Löschen der Vorlage' },
  'add_account': { en: 'Add Account', de: 'Konto hinzufügen' },
  'confirm_delete_account': { en: 'Really delete account?', de: 'Konto wirklich löschen?' }
};

Object.keys(newKeys).forEach(key => {
  en.auth[key] = newKeys[key].en;
  de.auth[key] = newKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Missing auth keys added!');
