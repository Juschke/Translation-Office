<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('code', 3);         // EUR, USD, CHF
            $table->string('name');            // Euro, US-Dollar, Schweizer Franken
            $table->string('symbol', 5);       // €, $, Fr.
            $table->boolean('is_default')->default(false);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('currencies'); }
};
