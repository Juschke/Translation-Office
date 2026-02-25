<?php

use Illuminate\Support\Facades\Route;

// Public routes with strict rate limiting
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\Api\AuthController::class, 'resetPassword']);
});

Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\Api\VerificationController::class, 'verify'])
    ->name('verification.verify');

// Guest Project Access
Route::prefix('guest')->middleware(['throttle:30,1'])->group(function () {
    Route::get('project/{token}', [\App\Http\Controllers\Api\GuestProjectController::class, 'show']);
    Route::put('project/{token}', [\App\Http\Controllers\Api\GuestProjectController::class, 'update']);
    Route::post('project/{token}/message', [\App\Http\Controllers\Api\GuestProjectController::class, 'message']);
    Route::post('project/{token}/files', [\App\Http\Controllers\Api\GuestProjectController::class, 'upload']);
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

        // Subscription & Billing
        Route::put('/subscription/plan', [\App\Http\Controllers\Api\SubscriptionController::class, 'updatePlan']);
        Route::put('/subscription/payment-method', [\App\Http\Controllers\Api\SubscriptionController::class, 'updatePaymentMethod']);
        Route::get('/subscription/invoices', [\App\Http\Controllers\Api\SubscriptionController::class, 'invoices']);

        // Bulk delete operations
        Route::post('customers/bulk-delete', [\App\Http\Controllers\Api\CustomerController::class, 'bulkDelete']);
        Route::post('partners/bulk-delete', [\App\Http\Controllers\Api\PartnerController::class, 'bulkDelete']);
        Route::post('projects/bulk-delete', [\App\Http\Controllers\Api\ProjectController::class, 'bulkDelete']);
    });

    // ── Manager+ routes ──
    Route::middleware(['tenant.role:manager'])->group(function () {
        // Settings read + master data management
        Route::get('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
        Route::apiResource('settings/languages', \App\Http\Controllers\Api\LanguageController::class);
        Route::apiResource('settings/price-matrices', \App\Http\Controllers\Api\PriceMatrixController::class);
        Route::apiResource('settings/document-types', \App\Http\Controllers\Api\DocumentTypeController::class);
        Route::apiResource('settings/services', \App\Http\Controllers\Api\ServiceController::class);
        Route::apiResource('settings/email-templates', \App\Http\Controllers\Api\EmailTemplateController::class);
        Route::get('settings/activities', [\App\Http\Controllers\Api\ActivityController::class, 'index']);

        // Bulk update operations
        Route::post('customers/bulk-update', [\App\Http\Controllers\Api\CustomerController::class, 'bulkUpdate']);
        Route::post('partners/bulk-update', [\App\Http\Controllers\Api\PartnerController::class, 'bulkUpdate']);
        Route::post('projects/bulk-update', [\App\Http\Controllers\Api\ProjectController::class, 'bulkUpdate']);

        // Invoices
        Route::get('invoices/next-number', [\App\Http\Controllers\Api\InvoiceController::class, 'nextNumber']);
        Route::post('invoices/bulk-update', [\App\Http\Controllers\Api\InvoiceController::class, 'bulkUpdate']);
        Route::post('invoices/datev-export', [\App\Http\Controllers\Api\InvoiceController::class, 'datevExport']);
        Route::post('invoices/{invoice}/generate-pdf', [\App\Http\Controllers\Api\InvoiceController::class, 'generatePdf']);
        Route::post('invoices/{invoice}/issue', [\App\Http\Controllers\Api\InvoiceController::class, 'issue']);
        Route::post('invoices/{invoice}/cancel', [\App\Http\Controllers\Api\InvoiceController::class, 'cancel']);
        Route::get('invoices/{invoice}/preview', [\App\Http\Controllers\Api\InvoiceController::class, 'preview']);
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
        Route::get('/reports/profitability', [\App\Http\Controllers\Api\ReportController::class, 'detailedProfitability']);



        // Mails
        Route::get('mails', [\App\Http\Controllers\Api\MailController::class, 'index']);
        Route::post('mails/send', [\App\Http\Controllers\Api\MailController::class, 'send']);
        Route::post('mails/sync', [\App\Http\Controllers\Api\MailController::class, 'sync']);
        Route::post('mails/{id}/read', [\App\Http\Controllers\Api\MailController::class, 'markAsRead']);
        Route::delete('mails/{id}', [\App\Http\Controllers\Api\MailController::class, 'destroy']);

        Route::get('mail/accounts', [\App\Http\Controllers\Api\MailResourceController::class, 'getAccounts']);
        Route::post('mail/accounts', [\App\Http\Controllers\Api\MailResourceController::class, 'storeAccount']);
        Route::put('mail/accounts/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'updateAccount']);
        Route::delete('mail/accounts/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'deleteAccount']);

        Route::get('mail/templates', [\App\Http\Controllers\Api\MailResourceController::class, 'getTemplates']);
        Route::post('mail/templates', [\App\Http\Controllers\Api\MailResourceController::class, 'storeTemplate']);
        Route::put('mail/templates/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'updateTemplate']);
        Route::delete('mail/templates/{id}', [\App\Http\Controllers\Api\MailResourceController::class, 'deleteTemplate']);

        // Partner management
        Route::apiResource('partners', App\Http\Controllers\Api\PartnerController::class);
        Route::get('/partners/stats', [App\Http\Controllers\Api\PartnerController::class, 'stats']);
    });

    // ── Employee+ routes (all authenticated users) ──
    // Customers (read + create for everyone, stats)
    Route::post('customers/check-duplicates', [\App\Http\Controllers\Api\CustomerController::class, 'checkDuplicates']);
    Route::get('/customers/stats', [\App\Http\Controllers\Api\CustomerController::class, 'stats']);
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);

    // Partners (Deduplication Check)
    Route::post('partners/check-duplicates', [\App\Http\Controllers\Api\PartnerController::class, 'checkDuplicates']);

    // Projects
    Route::post('projects/analyze', [\App\Http\Controllers\Api\ProjectController::class, 'analyze']);
    Route::middleware(['throttle:20,1'])->group(function () {
        Route::post('projects/{project}/files', [\App\Http\Controllers\Api\ProjectFileController::class, 'store']);
    });
    Route::delete('projects/{project}/files/{file}', [\App\Http\Controllers\Api\ProjectFileController::class, 'destroy']);
    Route::put('projects/{project}/files/{file}', [\App\Http\Controllers\Api\ProjectFileController::class, 'update']);
    Route::get('projects/{project}/files/{file}/download', [\App\Http\Controllers\Api\ProjectFileController::class, 'download']);
    Route::apiResource('projects', \App\Http\Controllers\Api\ProjectController::class);
    Route::post('projects/{project}/invite', [\App\Http\Controllers\Api\ProjectController::class, 'inviteParticipant']);
    Route::post('projects/{project}/generate-document', [\App\Http\Controllers\Api\ProjectController::class, 'generateDocument']);
    Route::get('projects/{project}/activities', [\App\Http\Controllers\Api\ProjectController::class, 'getActivities']);
    Route::post('projects/{project}/generate-token', [\App\Http\Controllers\Api\ProjectController::class, 'generateToken']);
    Route::get('projects/{project}/confirmation/{type}', [\App\Http\Controllers\Api\ProjectController::class, 'downloadConfirmation']);
    Route::post('projects/{project}/message', [\App\Http\Controllers\Api\ProjectController::class, 'postMessage']);

    // Calendar & Appointments
    Route::get('calendar/events', [\App\Http\Controllers\Api\CalendarController::class, 'index']);
    Route::apiResource('appointments', \App\Http\Controllers\Api\CalendarController::class)->except(['index']);

    // Notifications
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
});

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
});
