<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_invoices', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->after('tenant_id')->constrained()->nullOnDelete();
            $table->date('billing_period_start')->nullable()->after('invoice_number');
            $table->date('billing_period_end')->nullable()->after('billing_period_start');
            $table->decimal('amount_net', 10, 2)->default(0)->after('billing_period_end');
            $table->decimal('tax_amount', 10, 2)->default(0)->after('amount_net');
            $table->timestamp('paid_at')->nullable()->after('due_date');
            $table->string('payment_provider')->nullable()->after('paid_at');
            $table->string('external_invoice_id')->nullable()->after('payment_provider');
            $table->text('notes')->nullable()->after('pdf_url');

            $table->index(['tenant_id', 'status']);
            $table->index('invoice_date');
            $table->index('due_date');
        });

        DB::table('tenant_invoices')
            ->where('amount_net', 0)
            ->update([
                'amount_net' => DB::raw('amount'),
                'tax_amount' => 0,
            ]);
    }

    public function down(): void
    {
        Schema::table('tenant_invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subscription_id');
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['invoice_date']);
            $table->dropIndex(['due_date']);
            $table->dropColumn([
                'billing_period_start',
                'billing_period_end',
                'amount_net',
                'tax_amount',
                'paid_at',
                'payment_provider',
                'external_invoice_id',
                'notes',
            ]);
        });
    }
};
