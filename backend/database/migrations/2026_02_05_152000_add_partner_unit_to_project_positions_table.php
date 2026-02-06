<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('project_positions', function (Blueprint $table) {
            if (!Schema::hasColumn('project_positions', 'partner_unit')) {
                $table->string('partner_unit')->nullable()->after('unit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_positions', function (Blueprint $table) {
            $table->dropColumn('partner_unit');
        });
    }
};
