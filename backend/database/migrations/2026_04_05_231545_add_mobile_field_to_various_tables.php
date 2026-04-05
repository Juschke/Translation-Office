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
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('mobile')->nullable()->after('phone');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('mobile')->nullable()->after('phone');
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->string('mobile')->nullable()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('mobile');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('mobile');
        });

        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn('mobile');
        });
    }
};
