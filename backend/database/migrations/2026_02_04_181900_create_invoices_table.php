<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->date('due_date');
            $table->decimal('amount_net', 12, 2);
            $table->decimal('tax_rate', 5, 2)->default(19.00);
            $table->decimal('amount_tax', 12, 2);
            $table->decimal('amount_gross', 12, 2);
            $table->enum('status', ['pending', 'paid', 'overdue', 'deleted'])->default('pending');
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
