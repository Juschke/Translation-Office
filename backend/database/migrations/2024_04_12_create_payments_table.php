<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained();
            $table->foreignId('tenant_id')->constrained();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('EUR');
            $table->string('payment_method')->default('stripe');
            $table->string('stripe_intent_id')->nullable();
            $table->string('stripe_charge_id')->nullable();
            $table->string('status')->default('pending'); // pending, completed, failed, refunded
            $table->timestamp('paid_at')->nullable();
            $table->decimal('refunded_amount', 12, 2)->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['invoice_id']);
            $table->index(['tenant_id']);
            $table->index(['status']);
            $table->index(['stripe_intent_id']);
        });

        // Aktualisiere invoices-Tabelle mit Stripe-Feldern
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('stripe_intent_id')->nullable()->after('status');
            $table->timestamp('paid_at')->nullable()->after('issued_at');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('stripe_intent_id');
            $table->dropColumn('paid_at');
        });

        Schema::dropIfExists('payments');
    }
};
