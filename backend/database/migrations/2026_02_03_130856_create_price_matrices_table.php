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
        Schema::create('price_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('source_lang_id')->constrained('languages')->onDelete('cascade');
            $table->foreignId('target_lang_id')->constrained('languages')->onDelete('cascade');
            $table->string('currency', 3)->default('EUR');
            $table->decimal('price_per_word', 10, 4)->default(0);
            $table->decimal('price_per_line', 10, 4)->default(0);
            $table->decimal('minimum_charge', 10, 2)->default(0);
            $table->decimal('hourly_rate', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_matrices');
    }
};
