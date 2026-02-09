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
        DB::statement("ALTER TABLE projects MODIFY COLUMN status ENUM(
            'draft',
            'offer',
            'pending',
            'in_progress',
            'review',
            'ready_for_pickup',
            'delivered',
            'invoiced',
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
};
