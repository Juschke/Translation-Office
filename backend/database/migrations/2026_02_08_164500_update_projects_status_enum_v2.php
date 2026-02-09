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
        // Modify the enum column to include the new statuses derived from user request
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM(
            'draft',
            'offer',
            'in_progress',
            'review',
            'ready_for_pickup',
            'delivered',
            'completed',
            'cancelled',
            'archived',
            'deleted'
        ) DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to the previous version
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM('request', 'calculation', 'offer', 'ordered', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'archived', 'draft', 'pending', 'completed') DEFAULT 'draft'");
    }
};
