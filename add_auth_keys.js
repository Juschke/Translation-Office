const fs = require('fs');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Add more auth keys
const authKeysToAdd = {
  'fill_all_fields': { en: 'Please fill in all fields.', de: 'Bitte füllen Sie alle Felder aus.' },
  'passwords_no_match': { en: 'Passwords do not match.', de: 'Die Passwörter stimmen nicht überein.' },
  'registration_failed': { en: 'Registration failed.', de: 'Registrierung fehlgeschlagen.' },
  'back_to_login': { en: 'Back to Login', de: 'Zurück zum Login' },
  'create_account': { en: 'Create Account', de: 'Konto erstellen' },
  'signup_intro': { en: 'Sign up for a Translation Office account', de: 'Erstellen Sie ein Translation-Office-Konto' },
  'forgot_password_intro': { en: 'Forgot your password?', de: 'Haben Sie Ihr Passwort vergessen?' },
  'forgot_password_desc': { en: 'Enter your email address and we\'ll send you a link to reset your password.', de: 'Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.' },
  'reset_password': { en: 'Reset Password', de: 'Passwort zurücksetzen' },
  'password_reset_sent': { en: 'If an account exists with this email, a password reset link will be sent.', de: 'Falls ein Konto mit dieser E-Mail existiert, wird ein Passwort-Zurücksetzen-Link gesendet.' },
  'password_updated': { en: 'Your password has been updated successfully.', de: 'Ihr Passwort wurde erfolgreich aktualisiert.' },
  'new_password': { en: 'New Password', de: 'Neues Passwort' },
  'confirm_password': { en: 'Confirm Password', de: 'Passwort bestätigen' },
  'minimum_8_characters': { en: 'At least 8 characters', de: 'Mindestens 8 Zeichen' },
  'or': { en: 'or', de: 'oder' }
};

Object.keys(authKeysToAdd).forEach(key => {
  en.auth[key] = authKeysToAdd[key].en;
  de.auth[key] = authKeysToAdd[key].de;
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Auth translation keys added!');
