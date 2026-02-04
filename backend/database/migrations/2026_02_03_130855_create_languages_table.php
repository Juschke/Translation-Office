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
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('iso_code', 10); // e.g. 'en-US'
            $table->string('name_internal');
            $table->string('name_native');
            $table->string('flag_icon')->nullable();
            $table->boolean('is_source_allowed')->default(true);
            $table->boolean('is_target_allowed')->default(true);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();

            $table->unique(['tenant_id', 'iso_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
