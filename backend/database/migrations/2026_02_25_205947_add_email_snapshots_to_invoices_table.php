<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('snapshot_customer_email')->nullable()->after('snapshot_customer_leitweg_id');
            $table->string('snapshot_seller_email')->nullable()->after('snapshot_seller_vat_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['snapshot_customer_email', 'snapshot_seller_email']);
        });
    }
};
