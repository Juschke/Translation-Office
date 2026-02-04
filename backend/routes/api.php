<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Company Settings
    Route::get('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/settings/company', [\App\Http\Controllers\Api\SettingsController::class, 'update']);

    // Master Data
    Route::apiResource('settings/languages', \App\Http\Controllers\Api\LanguageController::class);
    Route::apiResource('settings/price-matrices', \App\Http\Controllers\Api\PriceMatrixController::class);
    Route::apiResource('settings/document-types', \App\Http\Controllers\Api\DocumentTypeController::class);

    // Project Management
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::post('projects/analyze', [\App\Http\Controllers\Api\ProjectController::class, 'analyze']);
    Route::apiResource('projects', \App\Http\Controllers\Api\ProjectController::class);
});
