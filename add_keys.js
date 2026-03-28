const fs = require('fs');
const path = require('path');

const enFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/en/common.json';
const deFile = '/home/oem/Desktop/Translation-Office/frontend/src/locales/de/common.json';

// Read files
let en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

// Ensure sections exist
en.guest_portal = en.guest_portal || {};
de.guest_portal = de.guest_portal || {};
en.auth = en.auth || {};
de.auth = de.auth || {};

// Add guest portal keys
const guestPortalKeys = {
  'title': { en: 'Project Portal', de: 'Projektportal' },
  'access_denied': { en: 'Access Denied', de: 'Zugriff verweigert' },
  'invalid_link': { en: 'Project could not be loaded. Please check the link.', de: 'Das Projekt konnte nicht geladen werden. Bitte prüfen Sie den Link.' },
  'loading': { en: 'Loading project...', de: 'Projekt wird geladen...' }
};

// Add auth keys
const authKeys = {
  'welcome_back': { en: 'Welcome back', de: 'Willkommen zurück' },
  'two_factor_title': { en: '2FA Confirmation', de: '2FA Bestätigung' },
  'two_factor_prompt': { en: 'Please enter your authenticator code.', de: 'Bitte geben Sie Ihren Authenticator-Code ein.' },
  'login_prompt': { en: 'Sign in to access your dashboard.', de: 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen.' },
  'invalid_credentials': { en: 'Invalid email or password.', de: 'Ungültige E-Mail-Adresse oder Passwort.' },
  'confirmation_code_required': { en: 'Please enter the confirmation code.', de: 'Bitte geben Sie den Bestätigungscode ein.' },
  'authenticator_code': { en: 'Authenticator Code', de: 'Authenticator-Code' }
};

// Add guest portal keys
Object.keys(guestPortalKeys).forEach(key => {
  en.guest_portal[key] = guestPortalKeys[key].en;
  de.guest_portal[key] = guestPortalKeys[key].de;
});

// Add auth keys
Object.keys(authKeys).forEach(key => {
  en.auth[key] = authKeys[key].en;
  de.auth[key] = authKeys[key].de;
});

// Add notification-specific keys if not present
if (!en.notifications.mark_all_as_read) {
  en.notifications.mark_all_as_read = 'Mark all as read';
  de.notifications.mark_all_as_read = 'Alle als gelesen markieren';
  en.notifications.no_notifications_message = 'You are up to date!';
  de.notifications.no_notifications_message = 'Sie sind auf dem neuesten Stand!';
}

// Write files
fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(deFile, JSON.stringify(de, null, 2) + '\n');

console.log('✓ Translation keys added successfully!');
