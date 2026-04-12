<?php

use Illuminate\Support\Facades\Route;

// Public routes with strict rate limiting
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\Api\AuthController::class, 'resetPassword']);
});

// Token Refresh (requires valid refresh_token cookie)
Route::middleware(['auth:sanctum'])->post('/auth/refresh', [\App\Http\Controllers\Api\AuthController::class, 'refresh']);

Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\Api\VerificationController::class, 'verify'])
    ->name('verification.verify');

// Guest Project Access
Route::prefix('guest')->middleware(['throttle:30,1'])->group(function () {
    Route::get('project/{token}', [\App\Http\Controllers\Api\GuestProjectController::class, 'show']);
    Route::put('project/{token}', [\App\Http\Controllers\Api\GuestProjectController::class, 'update']);
    Route::post('project/{token}/message', [\App\Http\Controllers\Api\GuestProjectController::class, 'message']);
    Route::post('project/{token}/files', [\App\Http\Controllers\Api\GuestProjectController::class, 'upload']);
    Route::get('project/{token}/files/{file}/download', [\App\Http\Controllers\Api\GuestProjectController::class, 'downloadFile']);
    Route::post('project/{token}/done', [\App\Http\Controllers\Api\GuestProjectController::class, 'markAsDone']);
    Route::get('project/{token}/avv', [\App\Http\Controllers\Api\GuestProjectController::class, 'downloadAvv']);
});

// Authenticated routes with rate limiting
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', [\App\Http\Controllers\Api\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::put('/user/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::put('/user/password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);
    Route::patch('/user/locale', [\App\Http\Controllers\Api\AuthController::class, 'updateLocale']);
    Route::post('/onboarding', [\App\Http\Controllers\Api\AuthController::class, 'onboarding']);

    // Email Verification
    Route::post('/email/resend', [\App\Http\Controllers\Api\VerificationController::class, 'resend']);

    // Two Factor Authentication
    Route::post('/user/two-factor/enable', [\App\Http\Controllers\Api\TwoFactorController::class, 'enable']);
    Route::post('/user/two-factor/confirm', [\App\Http\Controllers\Api\TwoFactorController::class, 'confirm']);
    Route::post('/user/two-factor/disable', [\App\Http\Controllers\Api\TwoFactorController::class, 'disable']);
    Route::get('/user/two-factor/recovery-codes', [\App\Http\Controllers\Api\TwoFactorController::class, 'getRecoveryCodes']);
    Route::post('/user/two-factor/recovery-codes', [\App\Http\Controllers\Api\TwoFactorController::class, 'regenerateRecoveryCodes']);

    // Dashboard
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'index']);
    Route::get('/compliance/summary', [\App\Http\Controllers\Api\ComplianceController::class, 'summary']);

    // ── Owner-only routes ──
    Route::middleware(['tenant.role:owner'])->group(function () {
        // User / Team management
        Route::get('users', [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::post('users', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::put('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::delete('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);

        // Company Settings
        Route::put('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
        Route::post('/settings/company/logo', [\App\Http\Controllers\Api\SettingsController::class, 'uploadLogo']);
        Route::delete('/settings/company/logo', [\App\Http\Controllers\Api\SettingsController::class, 'deleteLogo']);
        Route::post('/settings/mail/test', [\App\Http\Controllers\Api\SettingsController::class, 'testMailConnection']);

        // Subscription & Billing (Owner can view + request upgrades)
        Route::get('/subscription', [\App\Http\Controllers\Api\SubscriptionController::class, 'show']);
        Route::get('/subscription/history', [\App\Http\Controllers\Api\SubscriptionController::class, 'history']);
        Route::post('/subscription/request-upgrade', [\App\Http\Controllers\Api\SubscriptionController::class, 'requestUpgrade']);
        Route::get('/subscription/payment-method', [\App\Http\Controllers\Api\SubscriptionController::class, 'paymentMethod']);
        Route::get('/subscription/invoices', [\App\Http\Controllers\Api\SubscriptionController::class, 'invoices']);

        // Bulk delete operations (rate-limited)
        Route::middleware('bulk-rate-limit')->group(function () {
            Route::post('customers/bulk-delete', [\App\Http\Controllers\Api\CustomerController::class, 'bulkDelete']);
            Route::post('partners/bulk-delete', [\App\Http\Controllers\Api\PartnerController::class, 'bulkDelete']);
            Route::post('projects/bulk-delete', [\App\Http\Controllers\Api\ProjectController::class, 'bulkDelete']);
            Route::post('customers/bulk-update', [\App\Http\Controllers\Api\CustomerController::class, 'bulkUpdate']);
            Route::post('partners/bulk-update', [\App\Http\Controllers\Api\PartnerController::class, 'bulkUpdate']);
            Route::post('projects/bulk-update', [\App\Http\Controllers\Api\ProjectController::class, 'bulkUpdate']);
        });
    });

    // ── Manager+ routes ──
    Route::middleware(['tenant.role:manager'])->group(function () {
        // Settings read + master data management
        Route::get('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
        Route::apiResource('settings/languages', \App\Http\Controllers\Api\LanguageController::class);
        Route::apiResource('settings/price-matrices', \App\Http\Controllers\Api\PriceMatrixController::class);
        Route::apiResource('settings/document-types', \App\Http\Controllers\Api\DocumentTypeController::class);
        Route::apiResource('settings/project-statuses', \App\Http\Controllers\Api\ProjectStatusController::class);
        Route::apiResource('settings/services', \App\Http\Controllers\Api\ServiceController::class);
        Route::apiResource('settings/email-templates', \App\Http\Controllers\Api\EmailTemplateController::class);
        Route::apiResource('settings/specializations', \App\Http\Controllers\Api\SpecializationController::class);
        Route::apiResource('settings/units', \App\Http\Controllers\Api\UnitController::class);
        Route::apiResource('settings/currencies', \App\Http\Controllers\Api\CurrencyController::class);
        Route::get('settings/notifications', [\App\Http\Controllers\Api\NotificationSettingsController::class, 'index']);
        Route::put('settings/notifications', [\App\Http\Controllers\Api\NotificationSettingsController::class, 'update']);
        Route::get('settings/activities', [\App\Http\Controllers\Api\ActivityController::class, 'index']);

        // Bulk update operations
        Route::post('customers/bulk-update', [\App\Http\Controllers\Api\CustomerController::class, 'bulkUpdate']);
        Route::post('partners/bulk-update', [\App\Http\Controllers\Api\PartnerController::class, 'bulkUpdate']);
        Route::post('projects/bulk-update', [\App\Http\Controllers\Api\ProjectController::class, 'bulkUpdate']);

        // Invoices
        Route::get('invoices/next-number', [\App\Http\Controllers\Api\InvoiceController::class, 'nextNumber']);
        Route::post('invoices/bulk-update', [\App\Http\Controllers\Api\InvoiceController::class, 'bulkUpdate']);
        Route::post('invoices/bulk-delete', [\App\Http\Controllers\Api\InvoiceController::class, 'bulkDelete']);
        Route::post('invoices/datev-export', [\App\Http\Controllers\Api\InvoiceController::class, 'datevExport']);
        Route::post('invoices/gobd-export', [\App\Http\Controllers\Api\InvoiceController::class, 'gobdExport']);
        Route::post('invoices/{invoice}/generate-pdf', [\App\Http\Controllers\Api\InvoiceController::class, 'generatePdf']);
        Route::post('invoices/{invoice}/issue', [\App\Http\Controllers\Api\InvoiceController::class, 'issue']);
        Route::post('invoices/{invoice}/cancel', [\App\Http\Controllers\Api\InvoiceController::class, 'cancel']);
        Route::get('invoices/{invoice}/preview', [\App\Http\Controllers\Api\InvoiceController::class, 'preview']);
        Route::get('invoices/{invoice}/audit-logs', [\App\Http\Controllers\Api\InvoiceController::class, 'auditLogs']);
        Route::get('invoices/{invoice}/download', [\App\Http\Controllers\Api\InvoiceController::class, 'download']);
        Route::get('invoices/{invoice}/print', [\App\Http\Controllers\Api\InvoiceController::class, 'print']);
        Route::get('invoices/{invoice}/download-xml', [\App\Http\Controllers\Api\InvoiceController::class, 'downloadXml']);
        Route::apiResource('invoices', \App\Http\Controllers\Api\InvoiceController::class);

        // Reports
        Route::get('/reports/revenue', [\App\Http\Controllers\Api\ReportController::class, 'revenue']);
        Route::get('/reports/profit-margin', [\App\Http\Controllers\Api\ReportController::class, 'profitMargin']);
        Route::get('/reports/language-distribution', [\App\Http\Controllers\Api\ReportController::class, 'languageDistribution']);
        Route::get('/reports/kpis', [\App\Http\Controllers\Api\ReportController::class, 'kpis']);
        Route::get('/reports/summary', [\App\Http\Controllers\Api\ReportController::class, 'summary']);
        Route::get('/reports/customers', [\App\Http\Controllers\Api\ReportController::class, 'customers']);
        Route::get('/reports/project-status', [\App\Http\Controllers\Api\ReportController::class, 'projectStatus']);
        Route::get('/reports/tax', [\App\Http\Controllers\Api\ReportController::class, 'taxReport']);
        Route::get('/reports/tax/export', [\App\Http\Controllers\Api\FinanceExportController::class, 'exportTax']);
        Route::get('/reports/profitability', [\App\Http\Controllers\Api\ReportController::class, 'detailedProfitability']);
        Route::get('/reports/opos', [\App\Http\Controllers\Api\ReportController::class, 'oposReport']);
        Route::get('/reports/bwa', [\App\Http\Controllers\Api\ReportController::class, 'bwaReport']);
        Route::get('/reports/opos/export', [\App\Http\Controllers\Api\FinanceExportController::class, 'exportOpos']);

        // Mahnwesen (Dunning)
        Route::get('/dunning', [\App\Http\Controllers\Api\DunningController::class, 'index']);
        Route::post('/dunning/{invoice}/send', [\App\Http\Controllers\Api\DunningController::class, 'sendReminder']);
        Route::get('/dunning/{invoice}/logs/{log}/pdf', [\App\Http\Controllers\Api\DunningController::class, 'downloadDunningPdf']);
        Route::get('/dunning/settings', [\App\Http\Controllers\Api\DunningController::class, 'getSettings']);
        Route::put('/dunning/settings', [\App\Http\Controllers\Api\DunningController::class, 'updateSettings']);

        // Wiederkehrende Rechnungen
        Route::get('/recurring-invoices', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'index']);
        Route::post('/recurring-invoices', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'store']);
        Route::put('/recurring-invoices/{recurringInvoice}', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'update']);
        Route::delete('/recurring-invoices/{recurringInvoice}', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'destroy']);
        Route::post('/recurring-invoices/{recurringInvoice}/pause', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'pause']);
        Route::post('/recurring-invoices/{recurringInvoice}/activate', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'activate']);
        Route::post('/recurring-invoices/{recurringInvoice}/execute-now', [\App\Http\Controllers\Api\RecurringInvoiceController::class, 'executeNow']);



        // Mails
        Route::get('mails', [\App\Http\Controllers\Api\MailController::class, 'index']);
        Route::post('mails/send', [\App\Http\Controllers\Api\MailController::class, 'send']);
        Route::post('mails/sync', [\App\Http\Controllers\Api\MailController::class, 'sync']);
        Route::post('mails/bulk-delete', [\App\Http\Controllers\Api\MailController::class, 'bulkDelete']);
        Route::post('mails/bulk-restore', [\App\Http\Controllers\Api\MailController::class, 'bulkRestore']);
        Route::post('mails/bulk-archive', [\App\Http\Controllers\Api\MailController::class, 'bulkArchive']);
        Route::post('mails/bulk-unarchive', [\App\Http\Controllers\Api\MailController::class, 'bulkUnarchive']);
        Route::post('mails/{id}/read', [\App\Http\Controllers\Api\MailController::class, 'markAsRead']);
        Route::get('mails/{id}/attachments/{index}', [\App\Http\Controllers\Api\MailController::class, 'downloadAttachment']);
        Route::delete('mails/{id}', [\App\Http\Controllers\Api\MailController::class, 'destroy']);

        Route::get('mail/accounts', [\App\Http\Controllers\Api\MailResourceController::class, 'getAccounts']);
        Route::post('mail/accounts', [\App\Http\Controllers\Api\MailResourceController::class, 'storeAccount']);
        Route::put('mail/accounts/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'updateAccount']);
        Route::delete('mail/accounts/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'deleteAccount']);

        Route::get('mail/templates', [\App\Http\Controllers\Api\MailResourceController::class, 'getTemplates']);
        Route::post('mail/templates', [\App\Http\Controllers\Api\MailResourceController::class, 'storeTemplate']);
        Route::put('mail/templates/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'updateTemplate']);
        Route::delete('mail/templates/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'deleteTemplate']);

        Route::get('mail/signatures', [\App\Http\Controllers\Api\MailResourceController::class, 'getSignatures']);
        Route::post('mail/signatures', [\App\Http\Controllers\Api\MailResourceController::class, 'storeSignature']);
        Route::put('mail/signatures/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'updateSignature']);
        Route::delete('mail/signatures/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'deleteSignature']);

        // Partner management
        Route::apiResource('partners', App\Http\Controllers\Api\PartnerController::class);
        Route::get('/partners/stats', [App\Http\Controllers\Api\PartnerController::class, 'stats']);
        Route::get('/partners/{partner}/profile-card/pdf', [App\Http\Controllers\Api\PartnerController::class, 'downloadProfileCard']);

        // External Costs
        Route::get('external-costs/stats', [\App\Http\Controllers\Api\ExternalCostController::class, 'stats']);
        Route::apiResource('external-costs', \App\Http\Controllers\Api\ExternalCostController::class);

        // ──────── B2B Features ────────────────────────────────────
        // Payments & Stripe Integration
        Route::post('payments/create-intent', [\App\Http\Controllers\Api\PaymentController::class, 'createIntent']);
        Route::post('payments/confirm', [\App\Http\Controllers\Api\PaymentController::class, 'confirm']);
        Route::get('payments/invoice/{invoice}', [\App\Http\Controllers\Api\PaymentController::class, 'list']);
        Route::post('payments/{payment}/refund', [\App\Http\Controllers\Api\PaymentController::class, 'refund']);

        // API Keys Management
        Route::apiResource('api-keys', \App\Http\Controllers\Api\ApiKeyController::class);

        // Webhooks
        Route::apiResource('webhooks', \App\Http\Controllers\Api\WebhookController::class);
    });

    // ── Employee+ routes (all authenticated users) ──
    // Customers (read + create for everyone, stats)
    Route::post('customers/check-duplicates', [\App\Http\Controllers\Api\CustomerController::class, 'checkDuplicates']);
    Route::get('/customers/stats', [\App\Http\Controllers\Api\CustomerController::class, 'stats']);
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::get('/customers/{customer}/master-data/pdf', [\App\Http\Controllers\Api\CustomerController::class, 'downloadMasterDataSheet']);

    // Partners (Deduplication Check)
    Route::post('partners/check-duplicates', [\App\Http\Controllers\Api\PartnerController::class, 'checkDuplicates']);

    // Files
    Route::get('files', [\App\Http\Controllers\Api\ProjectFileController::class, 'index']);

    // Projects
    Route::post('projects/analyze', [\App\Http\Controllers\Api\ProjectController::class, 'analyze']);
    Route::middleware(['throttle:20,1'])->group(function () {
        Route::post('projects/{project}/files', [\App\Http\Controllers\Api\ProjectFileController::class, 'store']);
    });
    Route::delete('projects/{project}/files/{file}', [\App\Http\Controllers\Api\ProjectFileController::class, 'destroy']);
    Route::put('projects/{project}/files/{file}', [\App\Http\Controllers\Api\ProjectFileController::class, 'update']);
    Route::get('projects/{project}/files/{file}/download', [\App\Http\Controllers\Api\ProjectFileController::class, 'download']);
    Route::post('projects/{project}/files/bulk-update', [\App\Http\Controllers\Api\ProjectFileController::class, 'bulkUpdate']);
    Route::post('projects/{project}/files/bulk-delete', [\App\Http\Controllers\Api\ProjectFileController::class, 'bulkDestroy']);
    Route::get('projects/{project}/files/download-zip', [\App\Http\Controllers\Api\ProjectFileController::class, 'downloadZip']);
    Route::apiResource('projects', \App\Http\Controllers\Api\ProjectController::class);
    Route::post('projects/{project}/invite', [\App\Http\Controllers\Api\ProjectController::class, 'inviteParticipant']);
    Route::post('projects/{project}/generate-document', [\App\Http\Controllers\Api\ProjectController::class, 'generateDocument']);
    Route::get('projects/{project}/documents/{type}', [\App\Http\Controllers\Api\ProjectController::class, 'downloadBusinessDocument']);
    Route::get('projects/{project}/activities', [\App\Http\Controllers\Api\ProjectController::class, 'getActivities']);
    Route::post('projects/{project}/generate-token', [\App\Http\Controllers\Api\ProjectController::class, 'generateToken']);
    Route::get('projects/{project}/confirmation/{type}', [\App\Http\Controllers\Api\ProjectController::class, 'downloadConfirmation']);
    Route::post('projects/{project}/message', [\App\Http\Controllers\Api\ProjectController::class, 'postMessage']);

    // Calendar & Appointments
    Route::get('calendar/events', [\App\Http\Controllers\Api\CalendarController::class, 'index']);
    Route::get('appointments', [\App\Http\Controllers\Api\CalendarController::class, 'list']);
    Route::apiResource('appointments', \App\Http\Controllers\Api\CalendarController::class)->except(['index']);


    // Notifications
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
});

// ── Customer Portal ────────────────────────────────────────────────────────
// Public: Auth
Route::prefix('portal')->middleware(['throttle:10,1'])->group(function () {
    Route::post('auth/login', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'login']);
    Route::post('auth/request-link', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'requestMagicLink']);
    Route::post('auth/verify-reset-code', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'verifyResetCode']);
    Route::post('auth/reset-password', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'resetPassword']);
    Route::get('auth/verify/{token}', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'verifyMagicLink']);
});

// Protected: Portal Features
Route::prefix('portal')
    ->middleware(['portal.customer', 'throttle:60,1'])
    ->group(function () {
        Route::get('me', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'me']);
        Route::post('logout', [\App\Http\Controllers\Api\Portal\PortalAuthController::class, 'logout']);
        Route::get('dashboard', [\App\Http\Controllers\Api\Portal\PortalController::class, 'dashboard']);
        Route::get('projects', [\App\Http\Controllers\Api\Portal\PortalController::class, 'projects']);
        Route::get('projects/{id}', [\App\Http\Controllers\Api\Portal\PortalController::class, 'showProject']);
        Route::post('projects/{id}/message', [\App\Http\Controllers\Api\Portal\PortalController::class, 'postMessage']);
        Route::get('invoices', [\App\Http\Controllers\Api\Portal\PortalController::class, 'invoices']);
        Route::get('invoices/{id}/download', [\App\Http\Controllers\Api\Portal\PortalController::class, 'downloadInvoice']);
        Route::put('profile', [\App\Http\Controllers\Api\Portal\PortalController::class, 'updateProfile']);
        Route::post('requests', [\App\Http\Controllers\Api\Portal\PortalRequestController::class, 'store']);
    });

// ──────── Public Webhooks (no auth required) ────────────────
// Stripe Webhook
Route::post('/webhooks/stripe', [\App\Http\Controllers\Api\WebhookController::class, 'stripe']);

// Custom Webhook for external integrations
Route::post('/webhooks/custom', [\App\Http\Controllers\Api\WebhookController::class, 'custom']);

// Admin routes - only accessible by platform admin users
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureUserIsAdmin::class, 'throttle:120,1'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard']);
    Route::get('/health', [\App\Http\Controllers\Admin\AdminController::class, 'health']);
    Route::get('/metrics', [\App\Http\Controllers\Admin\AdminController::class, 'metrics']);
    Route::get('/tenants', [\App\Http\Controllers\Admin\AdminController::class, 'tenants']);
    Route::get('/tenants/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'showTenant']);
    Route::put('/tenants/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateTenant']);
    Route::post('/tenants/{id}/toggle-status', [\App\Http\Controllers\Admin\AdminController::class, 'toggleTenantStatus']);
    Route::get('/logs', [\App\Http\Controllers\Admin\AdminController::class, 'logs']);

    // API Request Logs
    Route::get('/api-logs', [\App\Http\Controllers\Admin\AdminController::class, 'apiLogs']);
    Route::get('/api-logs/stats', [\App\Http\Controllers\Admin\AdminController::class, 'apiLogsStats']);
    Route::get('/api-logs/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'apiLogDetails']);
    Route::delete('/api-logs/clear', [\App\Http\Controllers\Admin\AdminController::class, 'clearApiLogs']);

    // Subscription Management (Software Owner only)
    Route::get('/subscriptions/stats', [\App\Http\Controllers\Api\Admin\SubscriptionController::class, 'stats']);
    Route::post('/subscriptions/{subscription}/cancel', [\App\Http\Controllers\Api\Admin\SubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/{subscription}/resume', [\App\Http\Controllers\Api\Admin\SubscriptionController::class, 'resume']);
    Route::apiResource('subscriptions', \App\Http\Controllers\Api\Admin\SubscriptionController::class);
});
