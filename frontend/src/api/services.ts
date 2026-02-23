/**
 * Zentraler Re-Export für alle API-Services.
 *
 * Die eigentliche Implementierung liegt in den Domain-Dateien unter ./services/.
 * Bestehende Imports wie `import { customerService } from '../api/services'`
 * funktionieren weiterhin ohne Änderungen.
 */
export { authService, twoFactorService } from './services/auth';
export { customerService } from './services/customers';
export { partnerService } from './services/partners';
export { projectService } from './services/projects';
export { invoiceService } from './services/invoices';
export { settingsService } from './services/settings';
export { mailService } from './services/mail';
export { reportService } from './services/reports';
export { notificationService } from './services/notifications';
export { subscriptionService } from './services/subscription';
export { guestService } from './services/guest';
export { userService, dashboardService } from './services/users';
