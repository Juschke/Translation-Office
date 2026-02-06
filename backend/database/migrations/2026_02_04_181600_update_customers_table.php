<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'type')) {
                $table->enum('type', ['private', 'company', 'authority'])->default('private')->after('tenant_id');
            }
            if (!Schema::hasColumn('customers', 'salutation')) {
                $table->string('salutation')->nullable()->after('type');
            }
            if (!Schema::hasColumn('customers', 'first_name')) {
                $table->string('first_name')->nullable()->after('salutation');
            }
            if (!Schema::hasColumn('customers', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('customers', 'address_house_no')) {
                $table->string('address_house_no')->nullable()->after('address_street');
            }
            if (!Schema::hasColumn('customers', 'address_country')) {
                $table->string('address_country')->default('DE')->after('address_city');
            }
            if (!Schema::hasColumn('customers', 'additional_emails')) {
                $table->json('additional_emails')->nullable()->after('email');
            }
            if (!Schema::hasColumn('customers', 'phone')) {
                $table->string('phone')->nullable()->after('additional_emails');
            }
            if (!Schema::hasColumn('customers', 'additional_phones')) {
                $table->json('additional_phones')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('customers', 'notes')) {
                $table->text('notes')->nullable()->after('price_matrix_id');
            }
            if (!Schema::hasColumn('customers', 'status')) {
                $table->string('status')->default('active')->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'salutation',
                'first_name',
                'last_name',
                'address_house_no',
                'address_country',
                'additional_emails',
                'phone',
                'additional_phones',
                'notes',
                'status'
            ]);
        });
    }
};
