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
        Schema::table('invoices', function (Blueprint $table) {
            $table->bigInteger('shipping_cents')->default(0)->after('amount_gross');
            $table->bigInteger('discount_cents')->default(0)->after('shipping_cents');
            $table->bigInteger('paid_amount_cents')->default(0)->after('discount_cents');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['shipping_cents', 'discount_cents', 'paid_amount_cents']);
        });
    }
};
