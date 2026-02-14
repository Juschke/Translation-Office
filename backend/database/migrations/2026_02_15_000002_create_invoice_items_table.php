<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Invoice Items — Frozen line-item snapshots
 *
 * These are NOT linked to project_positions via FK.
 * When an invoice is created, line items are copied ("frozen") from the project
 * positions into this table. This ensures GoBD compliance: the invoice content
 * is immutable and independent of any future changes to the project.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('position')->default(1); // Sort order

            // Frozen content (copied from project position at invoice creation)
            $table->string('description');
            $table->decimal('quantity', 12, 4)->default(1.0000);

            // Unit type for translation industry:
            // words, lines (Normzeilen), pages (Normseiten), hours, flat (Pauschal)
            $table->string('unit')->default('words');

            // All prices in cents (integer) to avoid floating-point errors
            $table->bigInteger('unit_price_cents')->default(0);  // Price per unit in cents
            $table->bigInteger('total_cents')->default(0);       // Line total in cents

            // Per-line tax rate (§ 14 UStG requires tax breakdown per line)
            $table->decimal('tax_rate', 5, 2)->default(19.00);

            $table->timestamps();

            // Index for efficient querying
            $table->index(['invoice_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
