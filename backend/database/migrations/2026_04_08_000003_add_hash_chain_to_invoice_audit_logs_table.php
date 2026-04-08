<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('invoice_audit_logs', 'previous_hash')) {
                $table->string('previous_hash', 64)->nullable()->after('new_status');
            }

            if (! Schema::hasColumn('invoice_audit_logs', 'record_hash')) {
                $table->string('record_hash', 64)->nullable()->after('previous_hash');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoice_audit_logs', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('invoice_audit_logs', 'previous_hash') ? 'previous_hash' : null,
                Schema::hasColumn('invoice_audit_logs', 'record_hash') ? 'record_hash' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
