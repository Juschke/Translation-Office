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
        Schema::table('project_files', function (Blueprint $table) {
            $table->string('file_name')->nullable()->after('original_name');
            $table->string('mime_type')->nullable()->after('file_name');
            $table->string('extension')->nullable()->after('mime_type');
            $table->bigInteger('file_size')->nullable()->after('extension'); // in bytes
            $table->integer('char_count')->nullable()->after('word_count');
            $table->string('version')->default('1.0')->after('char_count');
            $table->string('status')->default('ready')->after('version'); // ready, processing, error
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropColumn(['file_name', 'mime_type', 'extension', 'file_size', 'char_count', 'version', 'status', 'uploaded_by']);
        });
    }
};
