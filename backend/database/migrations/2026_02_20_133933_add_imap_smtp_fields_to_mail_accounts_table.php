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
        Schema::table('mail_accounts', function (Blueprint $table) {
            $table->renameColumn('host', 'smtp_host');
            $table->renameColumn('port', 'smtp_port');
            $table->renameColumn('encryption', 'smtp_encryption');

            $table->string('imap_host')->nullable()->after('email');
            $table->integer('imap_port')->default(993)->after('imap_host');
            $table->string('imap_encryption')->default('ssl')->after('imap_port');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mail_accounts', function (Blueprint $table) {
            $table->renameColumn('smtp_host', 'host');
            $table->renameColumn('smtp_port', 'port');
            $table->renameColumn('smtp_encryption', 'encryption');

            $table->dropColumn('imap_host');
            $table->dropColumn('imap_port');
            $table->dropColumn('imap_encryption');
        });
    }
};
