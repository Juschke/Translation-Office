<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add Stripe customer ID to customers table
        if (!Schema::hasColumn('customers', 'stripe_customer_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('stripe_customer_id')->nullable()->after('tenant_id');
            });
        }

        // Add currency column to invoices
        if (!Schema::hasColumn('invoices', 'currency')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('currency', 3)->default('EUR')->after('status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('stripe_customer_id');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
