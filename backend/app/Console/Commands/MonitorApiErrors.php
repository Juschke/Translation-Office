<?php

namespace App\Console\Commands;

use App\Models\ApiRequestLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class MonitorApiErrors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitor:api-errors {--threshold=10}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor API errors and send email alerts when threshold is exceeded';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $threshold = (int) $this->option('threshold');
        $timeWindow = now()->subMinutes(15); // Check last 15 minutes

        // Check for server errors (5xx)
        $serverErrors = ApiRequestLog::where('created_at', '>=', $timeWindow)
            ->where('status_code', '>=', 500)
            ->count();

        // Check for client errors (4xx)
        $clientErrors = ApiRequestLog::where('created_at', '>=', $timeWindow)
            ->where('status_code', '>=', 400)
            ->where('status_code', '<', 500)
            ->count();

        // Check for slow requests (>2s)
        $slowRequests = ApiRequestLog::where('created_at', '>=', $timeWindow)
            ->where('duration_ms', '>', 2000)
            ->count();

        $this->info("Server Errors (5xx): {$serverErrors}");
        $this->info("Client Errors (4xx): {$clientErrors}");
        $this->info("Slow Requests (>2s): {$slowRequests}");

        $alerts = [];

        // Check server errors
        if ($serverErrors >= $threshold) {
            $cacheKey = 'alert_sent_server_errors_' . now()->format('Y-m-d-H');
            if (!Cache::has($cacheKey)) {
                $alerts[] = [
                    'type' => 'Server Errors (5xx)',
                    'count' => $serverErrors,
                    'threshold' => $threshold,
                    'severity' => 'critical',
                ];
                Cache::put($cacheKey, true, now()->addHour());
            }
        }

        // Check client errors
        if ($clientErrors >= $threshold * 2) { // Higher threshold for 4xx
            $cacheKey = 'alert_sent_client_errors_' . now()->format('Y-m-d-H');
            if (!Cache::has($cacheKey)) {
                $alerts[] = [
                    'type' => 'Client Errors (4xx)',
                    'count' => $clientErrors,
                    'threshold' => $threshold * 2,
                    'severity' => 'warning',
                ];
                Cache::put($cacheKey, true, now()->addHour());
            }
        }

        // Check slow requests
        if ($slowRequests >= $threshold) {
            $cacheKey = 'alert_sent_slow_requests_' . now()->format('Y-m-d-H');
            if (!Cache::has($cacheKey)) {
                $alerts[] = [
                    'type' => 'Slow Requests (>2s)',
                    'count' => $slowRequests,
                    'threshold' => $threshold,
                    'severity' => 'warning',
                ];
                Cache::put($cacheKey, true, now()->addHour());
            }
        }

        // Send alerts
        if (!empty($alerts)) {
            $this->sendAlertEmail($alerts);
            $this->warn('⚠️  Alerts sent to admin!');
        } else {
            $this->info('✓ All systems normal');
        }

        return 0;
    }

    /**
     * Send alert email to admin.
     */
    protected function sendAlertEmail(array $alerts)
    {
        $adminEmail = config('mail.from.address');

        if (!$adminEmail) {
            $this->error('No admin email configured');
            return;
        }

        Mail::send('emails.api-error-alert', ['alerts' => $alerts], function ($message) use ($adminEmail) {
            $message->to($adminEmail)
                ->subject('⚠️ API Error Alert - Translation Office');
        });
    }
}
