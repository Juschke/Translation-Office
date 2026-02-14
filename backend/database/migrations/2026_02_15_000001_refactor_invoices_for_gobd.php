<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * GoBD-Compliance Migration for Invoices
 *
 * 1. Converts decimal amounts to integer (cents) to avoid floating-point errors
 * 2. Adds snapshot columns for customer/seller data (frozen at issue time)
 * 3. Adds storno/credit-note workflow fields
 * 4. Adds audit/locking fields for immutability
 * 5. Expands status enum for proper workflow states
 */
return new class extends Migration {
    public function up(): void
    {
        // Step 1: Add new columns to invoices
        Schema::table('invoices', function (Blueprint $table) {
            // --- Invoice type & storno ---
            $table->string('type')->default('invoice')->after('id'); // 'invoice' or 'credit_note'
            $table->unsignedBigInteger('cancelled_invoice_id')->nullable()->after('type');
            $table->foreign('cancelled_invoice_id')->references('id')->on('invoices')->nullOnDelete();

            // --- Locking / Immutability ---
            $table->boolean('is_locked')->default(false)->after('status');
            $table->timestamp('issued_at')->nullable()->after('is_locked');

            // --- Gap-free numbering per tenant per year ---
            $table->unsignedInteger('invoice_number_sequence')->nullable()->after('invoice_number');

            // --- Customer Snapshot (§ 14 UStG: vollständiger Name & Anschrift) ---
            $table->string('snapshot_customer_name')->nullable()->after('customer_id');
            $table->string('snapshot_customer_address')->nullable();
            $table->string('snapshot_customer_zip')->nullable();
            $table->string('snapshot_customer_city')->nullable();
            $table->string('snapshot_customer_country')->nullable();
            $table->string('snapshot_customer_vat_id')->nullable();
            $table->string('snapshot_customer_leitweg_id')->nullable();

            // --- Seller Snapshot (§ 14 UStG: eigener Name, Anschrift, StNr/USt-IdNr) ---
            $table->string('snapshot_seller_name')->nullable();
            $table->string('snapshot_seller_address')->nullable();
            $table->string('snapshot_seller_zip')->nullable();
            $table->string('snapshot_seller_city')->nullable();
            $table->string('snapshot_seller_country')->nullable();
            $table->string('snapshot_seller_tax_number')->nullable();
            $table->string('snapshot_seller_vat_id')->nullable();
            $table->string('snapshot_seller_bank_name')->nullable();
            $table->string('snapshot_seller_bank_iban')->nullable();
            $table->string('snapshot_seller_bank_bic')->nullable();

            // --- Project Snapshot ---
            $table->string('snapshot_project_name')->nullable();
            $table->string('snapshot_project_number')->nullable();

            // --- Notes (if not existing) ---
            if (!Schema::hasColumn('invoices', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        // Step 2: Convert existing decimal amounts to integer cents
        // Multiply all existing amounts by 100 to convert EUR → cents
        DB::statement('UPDATE invoices SET amount_net = ROUND(amount_net * 100) WHERE amount_net IS NOT NULL');
        DB::statement('UPDATE invoices SET amount_tax = ROUND(amount_tax * 100) WHERE amount_tax IS NOT NULL');
        DB::statement('UPDATE invoices SET amount_gross = ROUND(amount_gross * 100) WHERE amount_gross IS NOT NULL');

        // Step 3: Change column types from decimal to bigInteger
        Schema::table('invoices', function (Blueprint $table) {
            $table->bigInteger('amount_net')->default(0)->change();
            $table->bigInteger('amount_tax')->default(0)->change();
            $table->bigInteger('amount_gross')->default(0)->change();
        });

        // Step 4: Change status column from enum to string for flexibility
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });

        // Step 5: Backfill snapshot data from existing FK relations
        $invoices = DB::table('invoices')
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->select(
                'invoices.id',
                DB::raw("COALESCE(customers.company_name, CONCAT(customers.first_name, ' ', customers.last_name)) as cust_name"),
                DB::raw("CONCAT(COALESCE(customers.address_street, ''), ' ', COALESCE(customers.address_house_no, '')) as cust_address"),
                'customers.address_zip as cust_zip',
                'customers.address_city as cust_city',
                'customers.address_country as cust_country'
            )
            ->get();

        foreach ($invoices as $inv) {
            DB::table('invoices')->where('id', $inv->id)->update([
                'snapshot_customer_name' => $inv->cust_name,
                'snapshot_customer_address' => $inv->cust_address,
                'snapshot_customer_zip' => $inv->cust_zip,
                'snapshot_customer_city' => $inv->cust_city,
                'snapshot_customer_country' => $inv->cust_country,
            ]);
        }

        // Backfill seller (tenant) snapshot
        $tenantInvoices = DB::table('invoices')
            ->join('tenants', 'invoices.tenant_id', '=', 'tenants.id')
            ->select(
                'invoices.id',
                DB::raw("COALESCE(tenants.company_name, tenants.name) as seller_name"),
                DB::raw("CONCAT(COALESCE(tenants.address_street, ''), ' ', COALESCE(tenants.address_house_no, '')) as seller_address"),
                'tenants.address_zip as seller_zip',
                'tenants.address_city as seller_city',
                'tenants.address_country as seller_country',
                'tenants.tax_number as seller_tax',
                'tenants.vat_id as seller_vat',
                'tenants.bank_name as seller_bank_name',
                'tenants.bank_iban as seller_iban',
                'tenants.bank_bic as seller_bic'
            )
            ->get();

        foreach ($tenantInvoices as $inv) {
            DB::table('invoices')->where('id', $inv->id)->update([
                'snapshot_seller_name' => $inv->seller_name,
                'snapshot_seller_address' => $inv->seller_address,
                'snapshot_seller_zip' => $inv->seller_zip,
                'snapshot_seller_city' => $inv->seller_city,
                'snapshot_seller_country' => $inv->seller_country,
                'snapshot_seller_tax_number' => $inv->seller_tax,
                'snapshot_seller_vat_id' => $inv->seller_vat,
                'snapshot_seller_bank_name' => $inv->seller_bank_name,
                'snapshot_seller_bank_iban' => $inv->seller_iban,
                'snapshot_seller_bank_bic' => $inv->seller_bic,
            ]);
        }

        // Backfill project snapshot
        $projectInvoices = DB::table('invoices')
            ->join('projects', 'invoices.project_id', '=', 'projects.id')
            ->select('invoices.id', 'projects.project_name', 'projects.project_number')
            ->get();

        foreach ($projectInvoices as $inv) {
            DB::table('invoices')->where('id', $inv->id)->update([
                'snapshot_project_name' => $inv->project_name,
                'snapshot_project_number' => $inv->project_number,
            ]);
        }
    }

    public function down(): void
    {
        // Convert cents back to EUR
        DB::statement('UPDATE invoices SET amount_net = ROUND(amount_net / 100, 2) WHERE amount_net IS NOT NULL');
        DB::statement('UPDATE invoices SET amount_tax = ROUND(amount_tax / 100, 2) WHERE amount_tax IS NOT NULL');
        DB::statement('UPDATE invoices SET amount_gross = ROUND(amount_gross / 100, 2) WHERE amount_gross IS NOT NULL');

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('amount_net', 12, 2)->default(0)->change();
            $table->decimal('amount_tax', 12, 2)->default(0)->change();
            $table->decimal('amount_gross', 12, 2)->default(0)->change();

            $table->dropForeign(['cancelled_invoice_id']);
            $table->dropColumn([
                'type', 'cancelled_invoice_id', 'is_locked', 'issued_at',
                'invoice_number_sequence',
                'snapshot_customer_name', 'snapshot_customer_address',
                'snapshot_customer_zip', 'snapshot_customer_city',
                'snapshot_customer_country', 'snapshot_customer_vat_id',
                'snapshot_customer_leitweg_id',
                'snapshot_seller_name', 'snapshot_seller_address',
                'snapshot_seller_zip', 'snapshot_seller_city',
                'snapshot_seller_country', 'snapshot_seller_tax_number',
                'snapshot_seller_vat_id', 'snapshot_seller_bank_name',
                'snapshot_seller_bank_iban', 'snapshot_seller_bank_bic',
                'snapshot_project_name', 'snapshot_project_number',
            ]);
        });
    }
};
