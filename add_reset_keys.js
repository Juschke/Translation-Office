const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

const newKeys = {
  'invalid_reset_link': { en: 'Invalid reset link. Please request a new one.', de: 'Ungültiger Reset-Link. Bitte fordern Sie einen neuen Link an.' },
  'password_mismatch': { en: 'Passwords do not match.', de: 'Passwörter stimmen nicht überein.' },
  'password_min_8': { en: 'Password must be at least 8 characters long.', de: 'Das Passwort muss mindestens 8 Zeichen lang sein.' },
  'password_reset_success': { en: 'Password reset successfully.', de: 'Passwort erfolgreich zurückgesetzt.' },
  'password_reset_error': { en: 'Error resetting password.', de: 'Fehler beim Zurücksetzen des Passworts.' },
  'success': { en: 'Success!', de: 'Erfolgreich!' },
  'password_reset_done': { en: 'Your password has been successfully reset.', de: 'Ihr Passwort wurde erfolgreich zurückgesetzt.' },
  'can_login_now': { en: 'You can now sign in with your new password.', de: 'Sie können sich jetzt mit Ihrem neuen Passwort anmelden.' },
  'login_now': { en: 'Login Now', de: 'Jetzt anmelden' },
  'set_new_password': { en: 'Set New Password', de: 'Neues Passwort vergeben' },
  'secure_password_8_chars': { en: 'Please choose a secure password with at least 8 characters.', de: 'Bitte wählen Sie ein sicheres Passwort mit mindestens 8 Zeichen.' }
};

Object.keys(newKeys).forEach(key => {
  en.auth[key] = newKeys[key].en;
  de.auth[key] = newKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Reset password keys added!');
