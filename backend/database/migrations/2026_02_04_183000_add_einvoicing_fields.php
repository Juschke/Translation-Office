<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('legal_form')->nullable()->after('company_name'); // BT-27
            $table->string('address_street')->nullable()->after('legal_form'); // BT-35
            $table->string('address_house_no')->nullable()->after('address_street'); // BT-35
            $table->string('address_zip')->nullable()->after('address_house_no'); // BT-38
            $table->string('address_city')->nullable()->after('address_zip'); // BT-37
            $table->string('address_country')->default('DE')->after('address_city'); // BT-40
            $table->string('tax_number')->nullable()->after('address_country'); // BT-31
            $table->string('vat_id')->nullable()->after('tax_number'); // BT-31
            $table->string('bank_name')->nullable()->after('vat_id');
            $table->string('bank_iban')->nullable()->after('bank_name'); // BT-84
            $table->string('bank_bic')->nullable()->after('bank_iban');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('leitweg_id')->nullable()->after('status'); // BT-10
            $table->string('legal_form')->nullable()->after('type'); // BT-44
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->date('delivery_date')->nullable()->after('date'); // BT-72
            $table->date('service_period_start')->nullable()->after('delivery_date'); // BT-73
            $table->date('service_period_end')->nullable()->after('service_period_start'); // BT-74
            $table->string('currency', 3)->default('EUR')->after('amount_gross'); // BT-5
            $table->string('payment_method')->default('TRF')->after('currency'); // BT-81 (Trick: TRF = Transfer)
        });

        Schema::table('project_positions', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(19.00)->after('customer_total'); // BT-152
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['legal_form', 'address_street', 'address_house_no', 'address_zip', 'address_city', 'address_country', 'tax_number', 'vat_id', 'bank_name', 'bank_iban', 'bank_bic']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['leitweg_id', 'legal_form']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['delivery_date', 'service_period_start', 'service_period_end', 'currency', 'payment_method']);
        });

        Schema::table('project_positions', function (Blueprint $table) {
            $table->dropColumn('tax_rate');
        });
    }
};
