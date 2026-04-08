<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\DunningController;
use Illuminate\Console\Command;

class AutoEscalateDunning extends Command
{
    protected $signature   = 'dunning:auto-escalate';
    protected $description = 'Eskaliert Mahnungen automatisch basierend auf den Tenant-Einstellungen';

    public function handle(): int
    {
        $controller = new DunningController();
        $escalated  = $controller->autoEscalate();
        $this->info("Auto-Eskalation abgeschlossen: {$escalated} Rechnungen eskaliert.");
        return Command::SUCCESS;
    }
}
