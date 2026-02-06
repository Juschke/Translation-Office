<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\Api\VerificationController::class, 'verify'])
    ->name('verification.verify');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [\App\Http\Controllers\Api\AuthController::class, 'me']);
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::put('/user/profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::put('/user/password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);
    Route::post('/onboarding', [\App\Http\Controllers\Api\AuthController::class, 'onboarding']);

    // Email Verification
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

    // Company Settings
    Route::get('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'update']);

    // Subscription & Billing
    Route::put('/subscription/plan', [\App\Http\Controllers\Api\SubscriptionController::class, 'updatePlan']);
    Route::put('/subscription/payment-method', [\App\Http\Controllers\Api\SubscriptionController::class, 'updatePaymentMethod']);
    Route::get('/subscription/invoices', [\App\Http\Controllers\Api\SubscriptionController::class, 'invoices']);

    // Master Data
    Route::apiResource('settings/languages', \App\Http\Controllers\Api\LanguageController::class);
    Route::apiResource('settings/price-matrices', \App\Http\Controllers\Api\PriceMatrixController::class);
    Route::apiResource('settings/document-types', \App\Http\Controllers\Api\DocumentTypeController::class);
    Route::apiResource('settings/services', \App\Http\Controllers\Api\ServiceController::class);
    Route::apiResource('settings/email-templates', \App\Http\Controllers\Api\EmailTemplateController::class);
    Route::get('settings/activities', [\App\Http\Controllers\Api\ActivityController::class, 'index']);

    // Project Management
    Route::post('customers/bulk-update', [\App\Http\Controllers\Api\CustomerController::class, 'bulkUpdate']);
    Route::post('customers/bulk-delete', [\App\Http\Controllers\Api\CustomerController::class, 'bulkDelete']);
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);

    Route::post('partners/bulk-update', [\App\Http\Controllers\Api\PartnerController::class, 'bulkUpdate']);
    Route::post('partners/bulk-delete', [\App\Http\Controllers\Api\PartnerController::class, 'bulkDelete']);
    Route::get('/partners/stats', [App\Http\Controllers\Api\PartnerController::class, 'stats']);
    Route::apiResource('partners', App\Http\Controllers\Api\PartnerController::class);
    Route::post('projects/analyze', [\App\Http\Controllers\Api\ProjectController::class, 'analyze']);

    // Customers
    Route::get('/customers/stats', [\App\Http\Controllers\Api\CustomerController::class, 'stats']);

    // Project Files
    Route::post('projects/{project}/files', [\App\Http\Controllers\Api\ProjectFileController::class, 'store']);
    Route::delete('projects/{project}/files/{file}', [\App\Http\Controllers\Api\ProjectFileController::class, 'destroy']);
    Route::get('projects/{project}/files/{file}/download', [\App\Http\Controllers\Api\ProjectFileController::class, 'download']);

    Route::post('projects/bulk-update', [\App\Http\Controllers\Api\ProjectController::class, 'bulkUpdate']);
    Route::post('projects/bulk-delete', [\App\Http\Controllers\Api\ProjectController::class, 'bulkDelete']);
    // Reports
    Route::get('/reports/revenue', [\App\Http\Controllers\Api\ReportController::class, 'revenue']);
    Route::get('/reports/profit-margin', [\App\Http\Controllers\Api\ReportController::class, 'profitMargin']);
    Route::get('/reports/language-distribution', [\App\Http\Controllers\Api\ReportController::class, 'languageDistribution']);
    Route::get('/reports/kpis', [\App\Http\Controllers\Api\ReportController::class, 'kpis']);

    Route::apiResource('projects', \App\Http\Controllers\Api\ProjectController::class);
    Route::post('invoices/bulk-update', [\App\Http\Controllers\Api\InvoiceController::class, 'bulkUpdate']);
    Route::post('invoices/bulk-delete', [\App\Http\Controllers\Api\InvoiceController::class, 'bulkDelete']);
    Route::apiResource('invoices', \App\Http\Controllers\Api\InvoiceController::class);

    // Notifications
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
});
