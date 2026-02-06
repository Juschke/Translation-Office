<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['translator', 'interpreter', 'trans_interp', 'agency'])->default('translator');
            $table->string('salutation')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->json('additional_emails')->nullable();
            $table->string('phone')->nullable();
            $table->json('additional_phones')->nullable();
            $table->json('languages')->nullable();
            $table->json('domains')->nullable();
            $table->string('software')->nullable();
            $table->string('address_street')->nullable();
            $table->string('address_house_no')->nullable();
            $table->string('address_zip')->nullable();
            $table->string('address_city')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bic')->nullable();
            $table->string('iban')->nullable();
            $table->string('tax_id')->nullable();
            $table->integer('payment_terms')->default(30);
            $table->enum('price_mode', ['per_unit', 'flat', 'matrix'])->default('per_unit');
            $table->json('unit_rates')->nullable();
            $table->json('flat_rates')->nullable();
            $table->enum('status', ['available', 'busy', 'vacation', 'blacklisted', 'deleted'])->default('available');
            $table->integer('rating')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
