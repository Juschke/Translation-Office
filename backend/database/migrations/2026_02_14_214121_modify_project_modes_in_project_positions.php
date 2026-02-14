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
        Schema::table('project_positions', function (Blueprint $table) {
            $table->string('customer_mode')->default('unit')->change();
            $table->string('partner_mode')->default('unit')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_positions', function (Blueprint $table) {
            $table->enum('customer_mode', ['unit', 'flat'])->default('unit')->change();
            $table->enum('partner_mode', ['unit', 'flat'])->default('unit')->change();
        });
    }
};
