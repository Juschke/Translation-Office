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
        Schema::table('specializations', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('tenant_id');
        });
        Schema::table('units', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('tenant_id');
        });
        Schema::table('email_templates', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('specializations', function (Blueprint $table) {
            $table->dropColumn('code');
        });
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('code');
        });
        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
