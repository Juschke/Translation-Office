<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * API Request Log — Tracks all API requests with detailed information.
 *
 * Captures:
 * - Request method, URL, endpoint
 * - Status code, duration, memory usage
 * - Request/response body and headers
 * - User, tenant, IP, user agent
 * - Errors and stack traces
 */
class ApiRequestLog extends Model
{
    protected $fillable = [
        'method',
        'url',
        'endpoint',
        'status_code',
        'query_params',
        'request_body',
        'request_headers',
        'response_body',
        'response_headers',
        'duration_ms',
        'memory_usage',
        'ip_address',
        'user_agent',
        'referer',
        'user_id',
        'tenant_id',
        'user_email',
        'error_message',
        'error_trace',
        'session_id',
        'request_id',
    ];

    protected $casts = [
        'duration_ms' => 'float',
        'memory_usage' => 'integer',
        'status_code' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // Accessors for JSON fields
    public function getQueryParamsAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    public function setQueryParamsAttribute($value)
    {
        $this->attributes['query_params'] = $value ? json_encode($value) : null;
    }

    public function getRequestBodyAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    public function setRequestBodyAttribute($value)
    {
        $this->attributes['request_body'] = $value ? json_encode($value) : null;
    }

    public function getRequestHeadersAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    public function setRequestHeadersAttribute($value)
    {
        $this->attributes['request_headers'] = $value ? json_encode($value) : null;
    }

    public function getResponseBodyAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    public function setResponseBodyAttribute($value)
    {
        $this->attributes['response_body'] = $value ? json_encode($value) : null;
    }

    public function getResponseHeadersAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    public function setResponseHeadersAttribute($value)
    {
        $this->attributes['response_headers'] = $value ? json_encode($value) : null;
    }

    // Helper Methods
    public function isSuccessful(): bool
    {
        return $this->status_code >= 200 && $this->status_code < 300;
    }

    public function isError(): bool
    {
        return $this->status_code >= 400;
    }

    public function isSlow(): bool
    {
        return $this->duration_ms > 1000; // Slower than 1 second
    }

    public function getStatusColorAttribute(): string
    {
        if ($this->status_code >= 500) {
            return 'red';
        } elseif ($this->status_code >= 400) {
            return 'orange';
        } elseif ($this->status_code >= 300) {
            return 'yellow';
        } elseif ($this->status_code >= 200) {
            return 'green';
        }
        return 'gray';
    }

    public function getMethodColorAttribute(): string
    {
        return match($this->method) {
            'GET' => 'blue',
            'POST' => 'green',
            'PUT' => 'orange',
            'PATCH' => 'orange',
            'DELETE' => 'red',
            default => 'gray',
        };
    }
}
