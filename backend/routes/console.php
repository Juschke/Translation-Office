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
