<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('partner_paid')->default(false)->nullable()->after('partner_cost_net');
            $table->timestamp('partner_paid_at')->nullable()->after('partner_paid');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['partner_paid', 'partner_paid_at']);
        });
    }
};
