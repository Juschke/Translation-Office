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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('source_lang_id')->constrained('languages');
            $table->foreignId('target_lang_id')->constrained('languages');
            $table->foreignId('document_type_id')->nullable()->constrained('document_types');

            $table->string('project_name');
            $table->enum('status', ['request', 'calculation', 'offer', 'ordered', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'archived'])->default('request');

            $table->integer('word_count')->default(0);
            $table->integer('line_count')->default(0);

            $table->decimal('price_total', 10, 2)->nullable();
            $table->string('currency', 3)->default('EUR');

            $table->date('deadline')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
