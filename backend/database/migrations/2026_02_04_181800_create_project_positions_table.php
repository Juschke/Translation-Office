<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('project_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('description')->nullable();
            $table->decimal('amount', 12, 4)->default(0.00);
            $table->string('unit')->nullable();
            $table->decimal('quantity', 12, 4)->default(1.00);
            $table->decimal('partner_rate', 12, 4)->default(0.00);
            $table->enum('partner_mode', ['unit', 'flat'])->default('unit');
            $table->decimal('partner_total', 12, 2)->default(0.00);
            $table->decimal('customer_rate', 12, 4)->default(0.00);
            $table->enum('customer_mode', ['unit', 'flat'])->default('unit');
            $table->decimal('customer_total', 12, 2)->default(0.00);
            $table->enum('margin_type', ['markup', 'discount'])->default('markup');
            $table->decimal('margin_percent', 8, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_positions');
    }
};
