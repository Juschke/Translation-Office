<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dunning_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained();
            $table->foreignId('tenant_id')->constrained();
            $table->integer('reminder_level')->default(1);
            $table->decimal('outstanding_amount', 12, 2);
            $table->timestamp('sent_at');
            $table->string('status')->default('sent'); // sent, opened, acknowledged, failed
            $table->string('pdf_path')->nullable();
            $table->string('pdf_hash')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['invoice_id']);
            $table->index(['tenant_id']);
            $table->index(['reminder_level']);
            $table->index(['sent_at']);
        });

        Schema::create('dunning_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->unique();
            $table->boolean('enabled')->default(true);
            $table->json('days_overdue')->default('["3","10","20"]');
            $table->json('templates')->default('[]');
            $table->boolean('include_fees')->default(false);
            $table->decimal('fee_per_level', 8, 2)->default(5.00);
            $table->integer('max_reminders')->default(3);
            $table->boolean('stop_on_payment_plan')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dunning_settings');
        Schema::dropIfExists('dunning_logs');
    }
};
