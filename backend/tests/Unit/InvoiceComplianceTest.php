<?php

namespace Tests\Unit;

use App\Models\Invoice;
use PHPUnit\Framework\TestCase;

class InvoiceComplianceTest extends TestCase
{
    public function test_locked_invoice_can_transition_only_to_allowed_statuses(): void
    {
        $invoice = new Invoice([
            'status' => Invoice::STATUS_ISSUED,
            'is_locked' => true,
        ]);

        $this->assertTrue($invoice->canTransitionToStatus(Invoice::STATUS_ARCHIVED));
        $this->assertTrue($invoice->canTransitionToStatus(Invoice::STATUS_PAID));
        $this->assertTrue($invoice->canTransitionToStatus(Invoice::STATUS_OVERDUE));
        $this->assertTrue($invoice->canTransitionToStatus(Invoice::STATUS_CANCELLED));
        $this->assertFalse($invoice->canTransitionToStatus(Invoice::STATUS_DRAFT));
    }

    public function test_draft_invoice_cannot_use_locked_status_transitions(): void
    {
        $invoice = new Invoice([
            'status' => Invoice::STATUS_DRAFT,
            'is_locked' => false,
        ]);

        $this->assertFalse($invoice->canTransitionToStatus(Invoice::STATUS_ARCHIVED));
        $this->assertFalse($invoice->canTransitionToStatus(Invoice::STATUS_CANCELLED));
        $this->assertFalse($invoice->canTransitionToStatus(Invoice::STATUS_PAID));
        $this->assertFalse($invoice->canTransitionToStatus(Invoice::STATUS_OVERDUE));
    }

    public function test_amount_due_accessor_uses_cents_fields(): void
    {
        $invoice = new Invoice([
            'amount_gross' => 12500,
            'paid_amount_cents' => 2500,
        ]);

        $this->assertSame(100.0, $invoice->amount_due_eur);
    }
}
