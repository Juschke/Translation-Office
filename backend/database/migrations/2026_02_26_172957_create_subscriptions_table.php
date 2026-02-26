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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            // Subscription tier/plan
            $table->string('plan')->default('free'); // free, starter, professional, enterprise
            $table->string('billing_cycle')->default('monthly'); // monthly, yearly
            $table->string('status')->default('active'); // active, cancelled, expired, past_due, trial

            // Pricing (in cents as per project convention)
            $table->integer('price_net_cents')->default(0); // Monthly/yearly price net
            $table->integer('price_gross_cents')->default(0); // Monthly/yearly price gross
            $table->decimal('vat_rate_percent', 5, 2)->default(19.00); // German VAT

            // Trial period
            $table->boolean('is_trial')->default(false);
            $table->timestamp('trial_ends_at')->nullable();

            // Subscription period
            $table->timestamp('started_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // Plan limits (nullable = unlimited)
            $table->integer('max_users')->nullable();
            $table->integer('max_projects')->nullable();
            $table->integer('max_storage_gb')->nullable();

            // Payment provider info
            $table->string('payment_provider')->nullable(); // stripe, paypal, sepa, invoice
            $table->string('payment_provider_subscription_id')->nullable();
            $table->string('payment_provider_customer_id')->nullable();

            // Billing contact
            $table->string('billing_email')->nullable();
            $table->text('billing_address')->nullable();

            // Auto-renewal
            $table->boolean('auto_renew')->default(true);

            // Notes (internal)
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['tenant_id', 'status']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
