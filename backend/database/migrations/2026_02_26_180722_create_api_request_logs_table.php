<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('api_request_logs', function (Blueprint $table) {
            $table->id();

            // Request Info
            $table->string('method', 10); // GET, POST, PUT, DELETE, etc.
            $table->string('url', 500);
            $table->string('endpoint', 255)->index(); // /api/projects, /api/customers, etc.
            $table->integer('status_code')->index(); // HTTP status code (200, 404, 500, etc.)

            // Request Details
            $table->text('query_params')->nullable(); // URL query parameters as JSON
            $table->longText('request_body')->nullable(); // POST/PUT body as JSON
            $table->text('request_headers')->nullable(); // Request headers as JSON

            // Response Details
            $table->longText('response_body')->nullable(); // Response body as JSON
            $table->text('response_headers')->nullable(); // Response headers as JSON

            // Performance
            $table->float('duration_ms', 10, 2); // Request duration in milliseconds
            $table->integer('memory_usage')->nullable(); // Memory usage in bytes

            // Client Info
            $table->string('ip_address', 45)->index(); // IPv4 or IPv6
            $table->string('user_agent', 500)->nullable();
            $table->string('referer', 500)->nullable();

            // User/Tenant Info
            $table->foreignId('user_id')->nullable()->index();
            $table->foreignId('tenant_id')->nullable()->index();
            $table->string('user_email', 255)->nullable();

            // Error Info
            $table->text('error_message')->nullable();
            $table->text('error_trace')->nullable();

            // Metadata
            $table->string('session_id', 100)->nullable()->index();
            $table->string('request_id', 100)->nullable()->index(); // Unique request ID

            $table->timestamps();

            // Indexes for common queries
            $table->index(['created_at', 'status_code']);
            $table->index(['endpoint', 'method']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_request_logs');
    }
};
