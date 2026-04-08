<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'pdf_sha256')) {
                $table->string('pdf_sha256', 64)->nullable()->after('pdf_path');
            }

            if (! Schema::hasColumn('invoices', 'pdf_generated_at')) {
                $table->timestamp('pdf_generated_at')->nullable()->after('pdf_sha256');
            }

            if (! Schema::hasColumn('invoices', 'xml_path')) {
                $table->string('xml_path')->nullable()->after('pdf_generated_at');
            }

            if (! Schema::hasColumn('invoices', 'xml_sha256')) {
                $table->string('xml_sha256', 64)->nullable()->after('xml_path');
            }

            if (! Schema::hasColumn('invoices', 'xml_generated_at')) {
                $table->timestamp('xml_generated_at')->nullable()->after('xml_sha256');
            }

            if (! Schema::hasColumn('invoices', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('xml_generated_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('invoices', 'pdf_sha256') ? 'pdf_sha256' : null,
                Schema::hasColumn('invoices', 'pdf_generated_at') ? 'pdf_generated_at' : null,
                Schema::hasColumn('invoices', 'xml_path') ? 'xml_path' : null,
                Schema::hasColumn('invoices', 'xml_sha256') ? 'xml_sha256' : null,
                Schema::hasColumn('invoices', 'xml_generated_at') ? 'xml_generated_at' : null,
                Schema::hasColumn('invoices', 'archived_at') ? 'archived_at' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
