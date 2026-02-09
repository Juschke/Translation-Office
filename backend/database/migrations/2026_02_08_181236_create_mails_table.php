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
        Schema::create('mails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('folder')->default('inbox'); // inbox, sent, trash, drafts
            $table->string('from_email')->nullable();
            $table->text('to_emails')->nullable(); // JSON array
            $table->text('cc_emails')->nullable(); // JSON array
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->boolean('is_read')->default(false);
            $table->json('attachments')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['tenant_id', 'folder']);
            $table->index('from_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mails');
    }
};
