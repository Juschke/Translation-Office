<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Invoice Audit Log — GoBD-Compliance
 *
 * Tracks every status change and significant action on an invoice.
 * Required by GoBD: "Wer hat wann welchen Status geändert?"
 * Records are append-only and must never be deleted or modified.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Action types: created, issued, sent, paid, cancelled, reminder_sent, downloaded
            $table->string('action');

            // Status transition tracking
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();

            // Additional context (e.g. cancellation reason, amount changes)
            $table->json('metadata')->nullable();

            // IP address for security audit trail
            $table->string('ip_address')->nullable();

            $table->timestamp('created_at')->useCurrent();

            // Indexes for efficient querying
            $table->index(['invoice_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_audit_logs');
    }
};
