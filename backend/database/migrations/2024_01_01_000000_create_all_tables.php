<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. tenants ──────────────────────────────────────────────────
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('legal_form')->nullable();
            $table->string('managing_director')->nullable();
            $table->string('domain')->nullable();
            $table->string('address_street')->nullable();
            $table->string('address_house_no')->nullable();
            $table->string('address_zip')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_country')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->json('opening_hours')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('vat_id')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_iban')->nullable();
            $table->string('bank_bic')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->string('tax_office')->nullable();
            $table->string('subscription_plan')->default('free');
            $table->string('license_key')->nullable();
            $table->string('status')->default('active');
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // ── 2. users ────────────────────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('employee'); // owner | manager | employee
            $table->string('status')->default('active');
            $table->string('locale')->default('de');
            $table->boolean('is_admin')->default(false);
            $table->timestamp('last_login_at')->nullable();
            // 2FA (pragmarx/google2fa)
            $table->string('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Sanctum personal access tokens
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ── 3. tenant_settings ──────────────────────────────────────────
        Schema::create('tenant_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'key']);
        });

        // ── 4. subscriptions ────────────────────────────────────────────
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('plan')->default('free');
            $table->string('billing_cycle')->default('monthly');
            $table->string('status')->default('trial');
            $table->unsignedInteger('price_net_cents')->default(0);
            $table->unsignedInteger('price_gross_cents')->default(0);
            $table->decimal('vat_rate_percent', 5, 2)->default(19.00);
            $table->boolean('is_trial')->default(true);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('max_users')->nullable();
            $table->unsignedInteger('max_projects')->nullable();
            $table->unsignedInteger('max_storage_gb')->nullable();
            $table->string('payment_provider')->nullable();
            $table->string('payment_provider_subscription_id')->nullable();
            $table->string('payment_provider_customer_id')->nullable();
            $table->string('billing_email')->nullable();
            $table->text('billing_address')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        // ── 5. tenant_invoices (platform billing) ───────────────────────
        Schema::create('tenant_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_number')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency')->default('EUR');
            $table->string('status')->default('pending');
            $table->date('invoice_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('pdf_url')->nullable();
            $table->timestamps();
        });

        // ── 6. languages ────────────────────────────────────────────────
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('iso_code');
            $table->string('name_internal')->nullable();
            $table->string('name_native')->nullable();
            $table->string('flag_icon')->nullable();
            $table->boolean('is_source_allowed')->default(true);
            $table->boolean('is_target_allowed')->default(true);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 7. currencies ───────────────────────────────────────────────
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 3);
            $table->string('name');
            $table->string('symbol', 10)->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 8. units ────────────────────────────────────────────────────
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('abbreviation')->nullable();
            $table->string('type')->nullable();
            $table->string('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 9. specializations ──────────────────────────────────────────
        Schema::create('specializations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 10. services ────────────────────────────────────────────────
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('service_code')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('base_price', 10, 2)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 11. document_types ──────────────────────────────────────────
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('category')->nullable();
            $table->string('code')->nullable();
            $table->string('name');
            $table->decimal('default_price', 10, 2)->default(0);
            $table->decimal('vat_rate', 5, 2)->default(0);
            $table->string('template_file')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 12. project_statuses ────────────────────────────────────────
        Schema::create('project_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('label')->nullable();
            $table->string('color')->nullable();
            $table->string('style')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── 13. price_matrices ──────────────────────────────────────────
        Schema::create('price_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_lang_id')->nullable()->constrained('languages')->nullOnDelete();
            $table->foreignId('target_lang_id')->nullable()->constrained('languages')->nullOnDelete();
            $table->string('currency', 3)->default('EUR');
            $table->decimal('price_per_word', 10, 4)->default(0);
            $table->decimal('price_per_line', 10, 4)->default(0);
            $table->decimal('minimum_charge', 10, 2)->default(0);
            $table->decimal('hourly_rate', 10, 2)->default(0);
            $table->timestamps();
        });

        // ── 14. customers ───────────────────────────────────────────────
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('company'); // company | private
            $table->string('salutation')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->json('additional_emails')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->json('additional_phones')->nullable();
            $table->string('address_street')->nullable();
            $table->string('address_house_no')->nullable();
            $table->string('address_zip')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_country')->nullable();
            $table->foreignId('price_matrix_id')->nullable()->constrained('price_matrices')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('status')->default('active');
            $table->string('leitweg_id')->nullable();
            $table->string('legal_form')->nullable();
            $table->unsignedInteger('payment_terms_days')->default(14);
            $table->string('bank_account_holder')->nullable();
            $table->string('iban')->nullable();
            $table->string('bic')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('vat_id')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            // Customer portal
            $table->boolean('portal_access')->default(false);
            $table->string('portal_token')->nullable();
            $table->timestamp('portal_token_expires_at')->nullable();
            $table->string('portal_session_token')->nullable();
            $table->timestamp('portal_session_expires_at')->nullable();
            $table->timestamp('portal_last_login_at')->nullable();
            $table->timestamps();
        });

        // ── 15. partners ────────────────────────────────────────────────
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('freelancer'); // freelancer | agency
            $table->string('salutation')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->json('additional_emails')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->json('additional_phones')->nullable();
            $table->json('languages')->nullable();
            $table->json('domains')->nullable();
            $table->json('software')->nullable();
            $table->string('address_street')->nullable();
            $table->string('address_house_no')->nullable();
            $table->string('address_zip')->nullable();
            $table->string('address_city')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bic')->nullable();
            $table->string('iban')->nullable();
            $table->string('tax_id')->nullable();
            $table->unsignedInteger('payment_terms')->default(30);
            $table->string('price_mode')->default('unit'); // unit | flat
            $table->json('unit_rates')->nullable();
            $table->json('flat_rates')->nullable();
            $table->string('status')->default('active');
            $table->unsignedTinyInteger('rating')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 16. projects ────────────────────────────────────────────────
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('project_number')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('source_lang_id')->nullable()->constrained('languages')->nullOnDelete();
            $table->foreignId('target_lang_id')->nullable()->constrained('languages')->nullOnDelete();
            $table->foreignId('document_type_id')->nullable()->constrained('document_types')->nullOnDelete();
            $table->json('additional_doc_types')->nullable();
            $table->string('project_name')->nullable();
            $table->string('status')->default('draft');
            $table->string('access_token', 64)->nullable()->unique();
            $table->string('partner_access_token', 64)->nullable()->unique();
            $table->string('priority')->default('medium'); // low | medium | high | express
            $table->unsignedInteger('word_count')->default(0);
            $table->unsignedInteger('line_count')->default(0);
            $table->decimal('price_total', 10, 2)->default(0);
            $table->decimal('partner_cost_net', 10, 2)->default(0);
            $table->decimal('down_payment', 10, 2)->default(0);
            $table->date('down_payment_date')->nullable();
            $table->string('down_payment_note')->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->datetime('deadline')->nullable();
            $table->boolean('is_certified')->default(false);
            $table->boolean('has_apostille')->default(false);
            $table->boolean('is_express')->default(false);
            $table->boolean('classification')->default(false);
            $table->unsignedInteger('certified_count')->default(0);
            $table->unsignedInteger('apostille_count')->default(0);
            $table->unsignedInteger('express_count')->default(0);
            $table->unsignedInteger('classification_count')->default(0);
            $table->unsignedInteger('copies_count')->default(0);
            $table->decimal('copy_price', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('appointment_location')->nullable();
            $table->string('customer_reference')->nullable();
            $table->datetime('customer_date')->nullable();
            // Extra service prices
            $table->decimal('certified_price', 10, 2)->nullable();
            $table->decimal('apostille_price', 10, 2)->nullable();
            $table->decimal('express_price', 10, 2)->nullable();
            $table->decimal('classification_price', 10, 2)->nullable();
            // Extra service units
            $table->string('certified_unit')->nullable();
            $table->string('apostille_unit')->nullable();
            $table->string('express_unit')->nullable();
            $table->string('classification_unit')->nullable();
            $table->string('copies_unit')->nullable();
            $table->timestamps();
        });

        // ── 17. project_positions ───────────────────────────────────────
        Schema::create('project_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('unit')->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('partner_rate', 10, 4)->default(0);
            $table->string('partner_mode')->nullable();
            $table->decimal('partner_total', 10, 2)->default(0);
            $table->decimal('customer_rate', 10, 4)->default(0);
            $table->string('customer_mode')->nullable();
            $table->decimal('customer_total', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(19);
            $table->string('margin_type')->nullable();
            $table->decimal('margin_percent', 5, 2)->default(0);
            $table->timestamps();
        });

        // ── 18. project_files ───────────────────────────────────────────
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('source'); // source | target | reference | delivery
            $table->string('path');
            $table->string('original_name');
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('extension')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->unsignedInteger('word_count')->default(0);
            $table->unsignedInteger('char_count')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->string('status')->default('active');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_shared_with_customer')->default(false);
            $table->boolean('is_shared_with_partner')->default(false);
            $table->timestamps();
        });

        // ── 19. project_payments ────────────────────────────────────────
        Schema::create('project_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2)->default(0);
            $table->datetime('payment_date')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });

        // ── 20. messages ────────────────────────────────────────────────
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('content');
            $table->string('sender_name')->nullable();
            $table->boolean('is_read')->default(false);
            $table->string('type')->default('internal'); // internal | customer | partner
            $table->foreignId('project_file_id')->nullable()->constrained('project_files')->nullOnDelete();
            $table->timestamps();
        });

        // ── 21. appointments ────────────────────────────────────────────
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->datetime('start_date');
            $table->datetime('end_date')->nullable();
            $table->string('type')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('planned');
            $table->string('color')->nullable();
            $table->timestamps();
        });

        // ── 22. external_costs ──────────────────────────────────────────
        Schema::create('external_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description')->nullable();
            $table->string('cost_type')->nullable();
            $table->unsignedInteger('amount_cents')->default(0);
            $table->date('date')->nullable();
            $table->string('supplier')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 23. invoices ────────────────────────────────────────────────
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('invoice'); // invoice | credit_note
            $table->string('invoice_number')->nullable();
            $table->unsignedBigInteger('invoice_number_sequence')->nullable();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cancelled_invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('recurring_invoice_id')->nullable(); // set after recurring_invoices table exists
            $table->date('date')->nullable();
            $table->date('due_date')->nullable();
            $table->date('delivery_date')->nullable();
            $table->date('service_period_start')->nullable();
            $table->date('service_period_end')->nullable();
            $table->string('service_period')->nullable();
            // Amounts in cents (integer)
            $table->unsignedBigInteger('amount_net')->default(0);
            $table->decimal('tax_rate', 5, 2)->default(19);
            $table->unsignedBigInteger('amount_tax')->default(0);
            $table->unsignedBigInteger('amount_gross')->default(0);
            $table->unsignedBigInteger('shipping_cents')->default(0);
            $table->unsignedBigInteger('discount_cents')->default(0);
            $table->unsignedBigInteger('paid_amount_cents')->default(0);
            $table->string('currency', 3)->default('EUR');
            $table->string('payment_method')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_locked')->default(false);
            $table->timestamp('issued_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('pdf_sha256', 64)->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            $table->string('xml_path')->nullable();
            $table->string('xml_sha256', 64)->nullable();
            $table->timestamp('xml_generated_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('tax_exemption')->default('none'); // none | §19_ustg | reverse_charge
            $table->unsignedTinyInteger('reminder_level')->default(0);
            $table->date('last_reminder_date')->nullable();
            // Customer snapshot
            $table->string('snapshot_customer_name')->nullable();
            $table->string('snapshot_customer_address')->nullable();
            $table->string('snapshot_customer_zip')->nullable();
            $table->string('snapshot_customer_city')->nullable();
            $table->string('snapshot_customer_country')->nullable();
            $table->string('snapshot_customer_vat_id')->nullable();
            $table->string('snapshot_customer_email')->nullable();
            $table->string('snapshot_customer_leitweg_id')->nullable();
            // Seller snapshot
            $table->string('snapshot_seller_name')->nullable();
            $table->string('snapshot_seller_email')->nullable();
            $table->string('snapshot_seller_address')->nullable();
            $table->string('snapshot_seller_zip')->nullable();
            $table->string('snapshot_seller_city')->nullable();
            $table->string('snapshot_seller_country')->nullable();
            $table->string('snapshot_seller_tax_number')->nullable();
            $table->string('snapshot_seller_vat_id')->nullable();
            $table->string('snapshot_seller_bank_name')->nullable();
            $table->string('snapshot_seller_bank_iban')->nullable();
            $table->string('snapshot_seller_bank_bic')->nullable();
            // Project snapshot
            $table->string('snapshot_project_name')->nullable();
            $table->string('snapshot_project_number')->nullable();
            $table->text('intro_text')->nullable();
            $table->text('footer_text')->nullable();
            $table->timestamps();
        });

        // ── 24. invoice_items ───────────────────────────────────────────
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->text('description')->nullable();
            $table->decimal('quantity', 12, 4)->default(1);
            $table->string('unit')->nullable();
            $table->unsignedBigInteger('unit_price_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->decimal('tax_rate', 5, 2)->default(19);
            $table->timestamps();
        });

        // ── 25. invoice_audit_logs ──────────────────────────────────────
        Schema::create('invoice_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->string('previous_hash', 64)->nullable();
            $table->string('record_hash', 64)->unique();
            $table->json('metadata')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ── 26. dunning_settings ────────────────────────────────────────
        Schema::create('dunning_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('level1_days_after_due')->default(7);
            $table->unsignedInteger('level1_fee_cents')->default(0);
            $table->string('level1_subject')->nullable();
            $table->text('level1_body')->nullable();
            $table->unsignedInteger('level2_days_after_due')->default(14);
            $table->unsignedInteger('level2_fee_cents')->default(0);
            $table->string('level2_subject')->nullable();
            $table->text('level2_body')->nullable();
            $table->unsignedInteger('level3_days_after_due')->default(30);
            $table->unsignedInteger('level3_fee_cents')->default(0);
            $table->string('level3_subject')->nullable();
            $table->text('level3_body')->nullable();
            $table->boolean('auto_escalate')->default(false);
            $table->timestamps();
        });

        // ── 27. dunning_logs ────────────────────────────────────────────
        Schema::create('dunning_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('level');
            $table->unsignedInteger('fee_cents')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('sent_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pdf_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 28. recurring_invoices ──────────────────────────────────────
        Schema::create('recurring_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('template_invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->string('interval')->default('monthly'); // monthly | quarterly | yearly
            $table->date('next_run_at')->nullable();
            $table->date('last_run_at')->nullable();
            $table->unsignedInteger('occurrences_limit')->nullable();
            $table->unsignedInteger('occurrences_count')->default(0);
            $table->string('status')->default('active'); // active | paused
            $table->boolean('auto_issue')->default(false);
            $table->unsignedInteger('due_days')->default(14);
            $table->text('notes')->nullable();
            $table->json('template_items')->nullable();
            $table->foreignId('template_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('template_customer_name')->nullable();
            $table->unsignedBigInteger('template_amount_net_cents')->default(0);
            $table->decimal('template_tax_rate', 5, 2)->default(19);
            $table->unsignedBigInteger('template_amount_tax_cents')->default(0);
            $table->unsignedBigInteger('template_amount_gross_cents')->default(0);
            $table->string('template_currency', 3)->default('EUR');
            $table->text('template_intro_text')->nullable();
            $table->text('template_footer_text')->nullable();
            $table->text('template_notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        // Add FK from invoices → recurring_invoices (deferred)
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('recurring_invoice_id')->references('id')->on('recurring_invoices')->nullOnDelete();
        });

        // ── 29. mail_accounts ───────────────────────────────────────────
        Schema::create('mail_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('smtp_host')->nullable();
            $table->unsignedSmallInteger('smtp_port')->default(587);
            $table->string('smtp_encryption')->default('tls');
            $table->string('incoming_protocol')->default('imap');
            $table->string('imap_host')->nullable();
            $table->unsignedSmallInteger('imap_port')->default(993);
            $table->string('imap_encryption')->default('ssl');
            $table->string('username')->nullable();
            $table->text('password')->nullable(); // encrypted
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── 30. mail_signatures ─────────────────────────────────────────
        Schema::create('mail_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mail_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('content');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // ── 31. mail_templates ──────────────────────────────────────────
        Schema::create('mail_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->string('category')->nullable();
            $table->json('placeholders')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── 32. mails ───────────────────────────────────────────────────
        Schema::create('mails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mail_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('message_id')->nullable();
            $table->string('folder')->default('inbox');
            $table->string('from_email')->nullable();
            $table->json('to_emails')->nullable();
            $table->json('cc_emails')->nullable();
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->boolean('is_read')->default(false);
            $table->json('attachments')->nullable();
            $table->timestamp('date')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        // ── 33. email_templates ─────────────────────────────────────────
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->string('type')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ── 34. api_request_logs ────────────────────────────────────────
        Schema::create('api_request_logs', function (Blueprint $table) {
            $table->id();
            $table->string('method', 10)->nullable();
            $table->string('url', 2048)->nullable();
            $table->string('endpoint', 512)->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->text('query_params')->nullable();
            $table->longText('request_body')->nullable();
            $table->text('request_headers')->nullable();
            $table->longText('response_body')->nullable();
            $table->text('response_headers')->nullable();
            $table->float('duration_ms')->nullable();
            $table->unsignedInteger('memory_usage')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referer')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_email')->nullable();
            $table->text('error_message')->nullable();
            $table->longText('error_trace')->nullable();
            $table->string('session_id')->nullable();
            $table->string('request_id')->nullable();
            $table->timestamps();
        });

        // ── 35. activity_log (spatie/laravel-activitylog) ───────────────
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->text('description');
            $table->nullableMorphs('subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer');
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();
        });

        // ── 36. jobs / queue ────────────────────────────────────────────
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // ── 37. cache ───────────────────────────────────────────────────
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ── 38. notifications ───────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Drop in reverse order to avoid FK constraint issues
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('api_request_logs');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('mails');
        Schema::dropIfExists('mail_templates');
        Schema::dropIfExists('mail_signatures');
        Schema::dropIfExists('mail_accounts');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['recurring_invoice_id']);
        });
        Schema::dropIfExists('recurring_invoices');

        Schema::dropIfExists('dunning_logs');
        Schema::dropIfExists('dunning_settings');
        Schema::dropIfExists('invoice_audit_logs');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('external_costs');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('project_payments');
        Schema::dropIfExists('project_files');
        Schema::dropIfExists('project_positions');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('partners');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('price_matrices');
        Schema::dropIfExists('project_statuses');
        Schema::dropIfExists('document_types');
        Schema::dropIfExists('services');
        Schema::dropIfExists('specializations');
        Schema::dropIfExists('units');
        Schema::dropIfExists('currencies');
        Schema::dropIfExists('languages');
        Schema::dropIfExists('tenant_invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('tenant_settings');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('tenants');
    }
};
