<?php

namespace App\Jobs;

use App\Models\Webhook;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Async Job für Webhook-Triggers
 * Versendet Webhook-Payloads an externe URLs
 */
class TriggerWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 30;
    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public Webhook $webhook,
        public string $event,
        public array $data,
    ) {}

    public function handle()
    {
        try {
            $payload = [
                'event' => $this->event,
                'timestamp' => now()->toIso8601String(),
                'data' => $this->data,
                'webhook_id' => $this->webhook->id,
            ];

            // Erstelle Request mit Custom Headers
            $response = Http::timeout(15)
                ->retry(2, 100)
                ->withHeaders(array_merge(
                    [
                        'X-Webhook-Event' => $this->event,
                        'X-Webhook-ID' => $this->webhook->id,
                        'X-Webhook-Token' => $this->webhook->token,
                        'Content-Type' => 'application/json',
                    ],
                    $this->webhook->headers ?? []
                ))
                ->post($this->webhook->url, $payload);

            if (!$response->successful()) {
                Log::warning('Webhook delivery failed', [
                    'webhook_id' => $this->webhook->id,
                    'event' => $this->event,
                    'status' => $response->status(),
                    'response' => $response->body(),
                ]);

                throw new \Exception("HTTP {$response->status()}");
            }

            $this->webhook->recordTrigger();

            Log::info('Webhook delivered successfully', [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'response_time' => $response->header('X-Response-Time'),
            ]);
        } catch (\Exception $e) {
            Log::error('Webhook trigger failed', [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'error' => $e->getMessage(),
            ]);

            // Retry on failure
            throw $e;
        }
    }

    /**
     * Handle Job-Fehler
     */
    public function failed(\Throwable $exception)
    {
        Log::error('Webhook delivery permanently failed', [
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
            'error' => $exception->getMessage(),
        ]);

        // Optional: Deaktiviere Webhook nach zu vielen Fehlern
        if ($this->attempts() >= 5) {
            $this->webhook->update(['is_active' => false]);

            Log::alert('Webhook disabled due to repeated failures', [
                'webhook_id' => $this->webhook->id,
            ]);
        }
    }
}
