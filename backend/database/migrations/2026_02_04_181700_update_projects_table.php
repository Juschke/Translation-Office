<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'project_number')) {
                $table->string('project_number')->nullable()->after('id');
            }
            if (!Schema::hasColumn('projects', 'partner_id')) {
                $table->foreignId('partner_id')->nullable()->after('customer_id')->constrained('partners')->nullOnDelete();
            }
            if (!Schema::hasColumn('projects', 'priority')) {
                $table->enum('priority', ['low', 'medium', 'high'])->default('low')->after('status');
            }
            if (!Schema::hasColumn('projects', 'is_certified')) {
                $table->boolean('is_certified')->default(false)->after('deadline');
            }
            if (!Schema::hasColumn('projects', 'has_apostille')) {
                $table->boolean('has_apostille')->default(false)->after('is_certified');
            }
            if (!Schema::hasColumn('projects', 'is_express')) {
                $table->boolean('is_express')->default(false)->after('has_apostille');
            }
            if (!Schema::hasColumn('projects', 'classification')) {
                $table->boolean('classification')->default(false)->after('is_express');
            }
            if (!Schema::hasColumn('projects', 'copies_count')) {
                $table->integer('copies_count')->default(0)->after('classification');
            }
            if (!Schema::hasColumn('projects', 'copy_price')) {
                $table->decimal('copy_price', 10, 4)->default(5.00)->after('copies_count');
            }
            if (!Schema::hasColumn('projects', 'partner_cost_net')) {
                $table->decimal('partner_cost_net', 10, 2)->default(0.00)->after('price_total');
            }
            if (!Schema::hasColumn('projects', 'down_payment')) {
                $table->decimal('down_payment', 10, 2)->default(0.00)->after('partner_cost_net');
            }
            if (!Schema::hasColumn('projects', 'notes')) {
                $table->text('notes')->nullable()->after('down_payment');
            }
            if (!Schema::hasColumn('projects', 'additional_doc_types')) {
                $table->json('additional_doc_types')->nullable()->after('document_type_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropColumn([
                'project_number',
                'partner_id',
                'priority',
                'is_certified',
                'has_apostille',
                'is_express',
                'classification',
                'copies_count',
                'copy_price',
                'partner_cost_net',
                'down_payment',
                'notes',
                'additional_doc_types'
            ]);
        });
    }
};
