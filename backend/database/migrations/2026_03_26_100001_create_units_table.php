<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('name');            // Wort, Zeile, Seite, Stunde, Pauschal, Normseite
            $table->string('abbreviation')->nullable(); // Wrt, Zl, S., Std, Psch, NS
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('units'); }
};
