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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('appointment_location')->nullable()->after('deadline');
            $table->string('customer_reference')->nullable()->after('project_number');
            $table->date('customer_date')->nullable()->after('customer_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['appointment_location', 'customer_reference', 'customer_date']);
        });
    }
};
