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
        Schema::table('partners', function (Blueprint $table) {
            $table->boolean('portal_access')->default(false)->after('notes');
            $table->string('portal_token', 64)->nullable()->after('portal_access');
            $table->timestamp('portal_token_expires_at')->nullable()->after('portal_token');
            $table->string('portal_session_token', 64)->nullable()->after('portal_token_expires_at');
            $table->timestamp('portal_session_expires_at')->nullable()->after('portal_session_token');
            $table->timestamp('portal_last_login_at')->nullable()->after('portal_session_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn([
                'portal_access',
                'portal_token',
                'portal_token_expires_at',
                'portal_session_token',
                'portal_session_expires_at',
                'portal_last_login_at'
            ]);
        });
    }
};
