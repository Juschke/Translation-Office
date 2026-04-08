<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('pdf_sha256', 64)->nullable()->after('pdf_path');
            $table->timestamp('pdf_generated_at')->nullable()->after('pdf_sha256');
            $table->string('xml_path')->nullable()->after('pdf_generated_at');
            $table->string('xml_sha256', 64)->nullable()->after('xml_path');
            $table->timestamp('xml_generated_at')->nullable()->after('xml_sha256');
            $table->timestamp('archived_at')->nullable()->after('xml_generated_at');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'pdf_sha256',
                'pdf_generated_at',
                'xml_path',
                'xml_sha256',
                'xml_generated_at',
                'archived_at',
            ]);
        });
    }
};
