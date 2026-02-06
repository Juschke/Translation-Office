<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum column to include new statuses used by the frontend
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM('request', 'calculation', 'offer', 'ordered', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'archived', 'draft', 'pending', 'completed') DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original statuses (WARNING: this will fail if records with new statuses exist)
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM('request', 'calculation', 'offer', 'ordered', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'archived') DEFAULT 'request'");
    }
};
