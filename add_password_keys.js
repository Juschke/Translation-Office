const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

const newKeys = {
  'reset_email_sent': { en: 'We\'ve sent you an email with a reset link.', de: 'Wir haben Ihnen eine E-Mail mit einem Reset-Link gesendet.' },
  'error_try_again': { en: 'An error occurred. Please try again later.', de: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
  'forgot_password': { en: 'Forgot your password?', de: 'Passwort vergessen?' },
  'no_problem': { en: 'No problem. Enter your email address and we\'ll send you a reset link.', de: 'Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Reset-Link.' },
  'email_sent': { en: 'Email sent', de: 'E-Mail versendet' },
  'check_spam': { en: 'Check your spam folder if you don\'t receive an email.', de: 'Prüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten.' },
  'back_to_login': { en: 'Back to login', de: 'Zurück zur Anmeldung' },
  'send_reset_link': { en: 'Send Reset Link', de: 'Reset-Link senden' }
};

Object.keys(newKeys).forEach(key => {
  en.auth[key] = newKeys[key].en;
  de.auth[key] = newKeys[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Password reset keys added!');
