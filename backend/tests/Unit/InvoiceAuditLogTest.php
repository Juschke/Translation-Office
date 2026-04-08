<?php

namespace Tests\Unit;

use App\Models\InvoiceAuditLog;
use PHPUnit\Framework\TestCase;

class InvoiceAuditLogTest extends TestCase
{
    public function test_audit_log_accepts_hash_chain_fields(): void
    {
        $log = new InvoiceAuditLog([
            'invoice_id' => 1,
            'user_id' => 2,
            'action' => InvoiceAuditLog::ACTION_ISSUED,
            'old_status' => 'draft',
            'new_status' => 'issued',
            'previous_hash' => str_repeat('a', 64),
            'record_hash' => str_repeat('b', 64),
            'metadata' => ['pdf_sha256' => str_repeat('c', 64)],
            'ip_address' => '127.0.0.1',
        ]);

        $this->assertSame(str_repeat('a', 64), $log->previous_hash);
        $this->assertSame(str_repeat('b', 64), $log->record_hash);
        $this->assertSame('issued', $log->new_status);
    }
}
