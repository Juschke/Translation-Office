<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_check_result_history_items')) {
            Schema::create('health_check_result_history_items', function (Blueprint $table) {
                $table->id();
                $table->string('check_name');
                $table->string('check_label');
                $table->string('status');
                $table->text('notification_message')->nullable();
                $table->string('short_summary')->nullable();
                $table->json('meta');
                $table->timestamp('ended_at')->useCurrent()->useCurrentOnUpdate();
                $table->uuid('batch')->index();
                $table->timestamps();

                $table->index('created_at');
            });
        }

        if (! Schema::hasTable('pulse_values')) {
            Schema::create('pulse_values', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('timestamp')->index();
                $table->string('type')->index();
                $table->mediumText('key');
                $table->char('key_hash', 16)->charset('binary')->virtualAs('unhex(md5(`key`))');
                $table->mediumText('value');

                $table->unique(['type', 'key_hash']);
            });
        }

        if (! Schema::hasTable('pulse_entries')) {
            Schema::create('pulse_entries', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('timestamp')->index();
                $table->string('type')->index();
                $table->mediumText('key');
                $table->char('key_hash', 16)->charset('binary')->virtualAs('unhex(md5(`key`))');
                $table->bigInteger('value')->nullable();

                $table->index('key_hash');
                $table->index(['timestamp', 'type', 'key_hash', 'value']);
            });
        }

        if (! Schema::hasTable('pulse_aggregates')) {
            Schema::create('pulse_aggregates', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('bucket');
                $table->unsignedMediumInteger('period');
                $table->string('type');
                $table->mediumText('key');
                $table->char('key_hash', 16)->charset('binary')->virtualAs('unhex(md5(`key`))');
                $table->string('aggregate');
                $table->decimal('value', 20, 2);
                $table->unsignedInteger('count')->nullable();

                $table->unique(['bucket', 'period', 'type', 'aggregate', 'key_hash']);
                $table->index(['period', 'bucket']);
                $table->index('type');
                $table->index(['period', 'type', 'aggregate', 'bucket']);
            });
        }

        if (! Schema::hasTable('sent_emails')) {
            Schema::create('sent_emails', function (Blueprint $table) {
                $table->id();
                $table->date('date')->nullable();
                $table->string('from')->nullable();
                $table->text('to')->nullable();
                $table->text('cc')->nullable();
                $table->text('bcc')->nullable();
                $table->string('subject')->nullable();
                $table->text('body')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('telescope_entries')) {
            Schema::create('telescope_entries', function (Blueprint $table) {
                $table->bigIncrements('sequence');
                $table->uuid('uuid')->unique();
                $table->uuid('batch_id')->index();
                $table->string('family_hash')->nullable()->index();
                $table->boolean('should_display_on_index')->default(true);
                $table->string('type', 20);
                $table->longText('content');
                $table->dateTime('created_at')->nullable()->index();

                $table->index(['type', 'should_display_on_index']);
            });
        }

        if (! Schema::hasTable('telescope_entries_tags')) {
            Schema::create('telescope_entries_tags', function (Blueprint $table) {
                $table->uuid('entry_uuid');
                $table->string('tag');

                $table->primary(['entry_uuid', 'tag']);
                $table->index('tag');
                $table->foreign('entry_uuid')
                    ->references('uuid')
                    ->on('telescope_entries')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('telescope_monitoring')) {
            Schema::create('telescope_monitoring', function (Blueprint $table) {
                $table->string('tag')->primary();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('telescope_monitoring');
        Schema::dropIfExists('telescope_entries_tags');
        Schema::dropIfExists('telescope_entries');
        Schema::dropIfExists('sent_emails');
        Schema::dropIfExists('pulse_aggregates');
        Schema::dropIfExists('pulse_entries');
        Schema::dropIfExists('pulse_values');
        Schema::dropIfExists('health_check_result_history_items');
    }
};
