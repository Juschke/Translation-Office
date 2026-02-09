<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mail_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Display Name
            $table->string('email');
            $table->string('host');
            $table->integer('port')->default(587);
            $table->string('encryption')->default('tls');
            $table->string('username');
            $table->string('password');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('mails', function (Blueprint $table) {
            $table->foreignId('mail_account_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mails', function (Blueprint $table) {
            $table->dropForeign(['mail_account_id']);
            $table->dropColumn('mail_account_id');
        });
        Schema::dropIfExists('mail_accounts');
    }
};
