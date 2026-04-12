<?php

namespace App\Jobs;

use App\Models\ApiRequestLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Queue job für asynchrones API-Request-Logging
 * Blockiert nicht den eigentlichen Request
 */
class LogApiRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 30;
    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(
        public string $method,
        public string $path,
        public int $statusCode,
        public float $duration,
        public int $memory,
        public ?int $userId,
        public string $ip,
        public array $requestData = [],
        public ?string $userAgent = null,
    ) {}

    public function handle()
    {
        try {
            ApiRequestLog::create([
                'user_id' => $this->userId,
                'method' => $this->method,
                'path' => $this->path,
                'status_code' => $this->statusCode,
                'duration_ms' => (int) ($this->duration * 1000),
                'memory_mb' => round($this->memory / 1024 / 1024, 2),
                'ip_address' => $this->ip,
                'user_agent' => $this->userAgent,
                'request_data' => json_encode($this->redactSensitiveData($this->requestData)),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log API request', [
                'path' => $this->path,
                'error' => $e->getMessage(),
            ]);

            // Rethrow to trigger retry
            throw $e;
        }
    }

    /**
     * Entferne sensitive Daten aus Request-Logging
     */
    private function redactSensitiveData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'api_key',
            'api_secret',
            'credit_card',
            'cvv',
            'iban',
            'bic',
            'two_factor_code',
            'code',
            'secret',
        ];

        foreach ($sensitiveKeys as $key) {
            if (isset($data[$key])) {
                $data[$key] = '[REDACTED]';
            }
        }

        return $data;
    }
}
