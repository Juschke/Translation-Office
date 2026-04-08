<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('invoices:check-overdue', function () {
    $this->info('Checking for overdue invoices...');

    $count = \App\Models\Invoice::whereIn('status', ['issued', 'sent', 'overdue'])
        ->get()
        ->each(function ($invoice) {
            $invoice->save(); // Triggers syncStatus() via saving event
        })
        ->count();

    $this->info("Processed {$count} invoices.");
})->purpose('Check and update status for overdue invoices')->daily();

use Illuminate\Support\Facades\Schedule;

// Monitor API errors every 15 minutes and send alerts
Schedule::command('monitor:api-errors --threshold=10')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Mahnwesen: Auto-Eskalation täglich
Schedule::command('dunning:auto-escalate')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground();

// Wiederkehrende Rechnungen: täglich früh verarbeiten
Schedule::command('invoices:process-recurring')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground();

// GoBD: Hash-Ketten-Verifikation täglich – bei Fehler Alert per E-Mail
Schedule::command('invoices:verify-audit-chain')
    ->daily()
    ->emailOutputOnFailure('admin@localhost');
