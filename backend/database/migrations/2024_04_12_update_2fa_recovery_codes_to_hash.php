<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rename column from plaintext to hashed version
            if (Schema::hasColumn('users', 'two_factor_recovery_codes')) {
                $table->renameColumn('two_factor_recovery_codes', 'two_factor_recovery_codes_hash');
            }
        });
    }

    public function down(): void
    {
        // Revert column name
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'two_factor_recovery_codes_hash')) {
                $table->renameColumn('two_factor_recovery_codes_hash', 'two_factor_recovery_codes');
            }
        });
    }
};
