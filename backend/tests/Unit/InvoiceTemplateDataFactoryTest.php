<?php

namespace Tests\Unit;

use App\Models\Invoice;
use App\Models\Tenant;
use App\Support\InvoiceTemplateDataFactory;
use Tests\TestCase;

class InvoiceTemplateDataFactoryTest extends TestCase
{
    public function test_it_builds_professional_document_metadata_for_standard_invoice(): void
    {
        $invoice = new Invoice([
            'type' => Invoice::TYPE_INVOICE,
            'invoice_number' => 'RE-2026-0042',
            'date' => '2026-04-08',
            'due_date' => '2026-04-22',
            'amount_net' => 10000,
            'amount_tax' => 1900,
            'amount_gross' => 11900,
            'paid_amount_cents' => 0,
            'snapshot_customer_name' => 'Musterkunde GmbH',
            'snapshot_customer_address' => 'Hauptstrasse 10',
            'snapshot_customer_zip' => '10115',
            'snapshot_customer_city' => 'Berlin',
            'snapshot_customer_country' => 'Deutschland',
            'snapshot_project_name' => 'Fachuebersetzung',
            'payment_reference' => 'RE-2026-0042',
        ]);

        $tenant = new Tenant([
            'company_name' => 'Translation Office GmbH',
            'address_street' => 'Marktstrasse',
            'address_house_no' => '5',
            'address_zip' => '20095',
            'address_city' => 'Hamburg',
            'address_country' => 'Deutschland',
            'email' => 'info@example.test',
            'phone' => '+49 40 123456',
            'website' => 'example.test',
            'tax_number' => '12/345/67890',
            'vat_id' => 'DE123456789',
            'bank_name' => 'Musterbank',
            'bank_iban' => 'DE02120300000000202051',
            'bank_bic' => 'BYLADEM1001',
        ]);

        $data = InvoiceTemplateDataFactory::build($invoice, $tenant, [
            'invoice_primary_color' => '#16324f',
        ]);

        $this->assertSame('Rechnung', $data['document']['type_label']);
        $this->assertSame('RE-2026-0042', $data['document']['number']);
        $this->assertSame('Translation Office GmbH', $data['company']['name']);
        $this->assertSame('Musterkunde GmbH', $data['recipient']['name']);
        $this->assertSame(119.0, $data['amounts']['gross']);
        $this->assertSame(119.0, $data['amounts']['due']);
        $this->assertStringContainsString('Leistungen', $data['document']['intro_text']);
    }

    public function test_it_marks_credit_notes_and_tax_exempt_documents_correctly(): void
    {
        $invoice = new Invoice([
            'type' => Invoice::TYPE_CREDIT_NOTE,
            'invoice_number' => 'GS-2026-0003',
            'amount_net' => 5000,
            'amount_tax' => 0,
            'amount_gross' => 5000,
            'paid_amount_cents' => 5000,
            'tax_exemption' => Invoice::TAX_SMALL_BUSINESS,
            'snapshot_customer_name' => 'Beispiel AG',
        ]);

        $data = InvoiceTemplateDataFactory::build($invoice, null, []);

        $this->assertSame('Gutschrift', $data['document']['type_label']);
        $this->assertTrue($data['document']['is_credit_note']);
        $this->assertTrue($data['document']['is_tax_exempt']);
        $this->assertEquals(0.0, $data['amounts']['due']);
    }
}
