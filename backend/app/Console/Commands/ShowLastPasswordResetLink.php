<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ShowLastPasswordResetLink extends Command
{
    protected $signature = 'password:show-reset-link';
    protected $description = 'Zeigt den letzten Passwort-Reset-Link aus dem Log';

    public function handle()
    {
        $logFile = storage_path('logs/laravel.log');

        if (!file_exists($logFile)) {
            $this->error('Log-Datei nicht gefunden.');
            return 1;
        }

        $content = file_get_contents($logFile);

        // Suche nach Reset-Links
        preg_match_all('/http:\/\/localhost:5173\/reset-password\?token=([^&\s]+)&(?:amp;)?email=([^\s<]+)/', $content, $matches);

        if (empty($matches[0])) {
            $this->error('Kein Passwort-Reset-Link im Log gefunden.');
            return 1;
        }

        // Hole den letzten Link
        $lastLink = end($matches[0]);
        $lastLink = html_entity_decode($lastLink);

        $this->info('Letzter Passwort-Reset-Link:');
        $this->line('');
        $this->line($lastLink);
        $this->line('');
        $this->comment('Kopieren Sie diesen Link und öffnen Sie ihn im Browser.');

        return 0;
    }
}
