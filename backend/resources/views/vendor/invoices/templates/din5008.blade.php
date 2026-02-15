<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Rechnung</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @page {
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 210mm;
            height: 297mm;
            position: relative;
            margin: 0 auto;
        }

        /* DIN 5008 Type B Positioning */

        /* Sender Line (Small above address) */
        .sender-small {
            position: absolute;
            top: 45mm;
            left: 20mm;
            width: 85mm;
            font-size: 7pt;
            text-decoration: underline;
            color: #555;
            white-space: nowrap;
            overflow: hidden;
        }

        /* Recipient Address Window */
        .recipient {
            position: absolute;
            top: 50mm;
            left: 20mm;
            width: 85mm;
            height: 40mm;
        }

        .recipient p {
            margin: 0;
            line-height: 1.2;
            font-size: 11pt;
        }

        /* Info Block (Right Side) */
        /* DIN 5008 form B: Info block starts at 50mm from top, usually left aligned at 125mm */
        .info-block {
            position: absolute;
            top: 50mm;
            left: 125mm;
            width: 75mm;
            font-size: 9pt;
            line-height: 1.4;
        }

        .info-row {
            margin-bottom: 1mm;
            display: table;
            width: 100%;
        }

        .info-label {
            display: table-cell;
            font-weight: bold;
            width: 35mm;
            color: #555;
        }

        .info-value {
            display: table-cell;
            text-align: right;
        }

        /* Content Start */
        /* Subject line starts around 98mm or 105mm */
        .content {
            position: absolute;
            top: 105mm;
            left: 20mm;
            right: 20mm;
            width: 170mm;
        }

        .title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5mm;
            color: #000;
        }

        .intro-text {
            font-size: 10pt;
            margin-bottom: 8mm;
            line-height: 1.4;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10mm;
        }

        th {
            border-bottom: 1px solid #333;
            text-align: left;
            padding: 2mm 0;
            font-size: 9pt;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
        }

        td {
            border-bottom: 1px solid #eee;
            padding: 3mm 0;
            vertical-align: top;
            font-size: 10pt;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
        }

        .totals-table td {
            padding: 1mm 0;
            border: none;
        }

        .total-row td {
            border-top: 1px solid #333;
            padding-top: 2mm;
            font-size: 11pt;
            font-weight: bold;
        }

        .payment-info {
            margin-top: 15mm;
            font-size: 9pt;
            color: #444;
            border-top: 1px solid #eee;
            padding-top: 5mm;
            page-break-inside: avoid;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 15mm;
            left: 20mm;
            width: 170mm;
            border-top: 1px solid #ccc;
            padding-top: 3mm;
            font-size: 7pt;
            color: #666;
        }

        .footer-table {
            width: 100%;
            vertical-align: top;
        }

        .footer-col {
            vertical-align: top;
            width: 33%;
            padding-right: 2mm;
        }

        /* Logo (Optional) */
        .logo {
            position: absolute;
            top: 20mm;
            right: 20mm;
            text-align: right;
            max-height: 20mm;
        }
    </style>
</head>

<body>
    @php
        $tId = $invoice->tenant_id ?? 1;
        $settings = \App\Models\TenantSetting::where('tenant_id', $tId)->pluck('value', 'key');

        $companyName = $settings['company_name'] ?? 'Translation Office';
        $companyAddress = ($settings['address_street'] ?? '') . ' ' . ($settings['address_house_no'] ?? '');
        $companyCity = ($settings['address_zip'] ?? '') . ' ' . ($settings['address_city'] ?? '');
        $companyCountry = $settings['address_country'] ?? 'Deutschland';

        $fullAddress = trim($companyAddress . ', ' . $companyCity);

        $logoUrl = null; // $invoice->logo if available
    @endphp

    <div class="page">
        <!-- Logo -->
        <div class="logo">
            <h2 style="margin: 0; color: #333;">{{ $companyName }}</h2>
        </div>

        <!-- Sender Line -->
        <div class="sender-small">
            {{ $companyName }} • {{ $fullAddress }} • {{ $companyCountry }}
        </div>

        <!-- Recipient -->
        <div class="recipient">
            <p>
                <strong>{{ $invoice->buyer->name }}</strong><br>
                @if(isset($invoice->buyer->custom_fields['address']))
                    {!! nl2br(e($invoice->buyer->custom_fields['address'])) !!}<br>
                @endif
                <!-- Fallback if address is not in custom_fields -->
                @if(!isset($invoice->buyer->custom_fields['address']))
                    {{ $invoice->buyer->custom_fields['street'] ?? '' }}
                    {{ $invoice->buyer->custom_fields['house_no'] ?? '' }}<br>
                    {{ $invoice->buyer->custom_fields['zip'] ?? '' }} {{ $invoice->buyer->custom_fields['city'] ?? '' }}<br>
                    {{ $invoice->buyer->custom_fields['country'] ?? '' }}
                @endif
            </p>
        </div>

        <!-- Info Block -->
        <div class="info-block">
            <div class="info-row">
                <span class="info-label">{{ ($invoice->invoice_type ?? 'invoice') === 'credit_note' ? 'Gutschrifts' : 'Rechnungs' }}-Nr.</span>
                <span class="info-value">{{ $invoice->name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Datum</span>
                <span
                    class="info-value">{{ $invoice->date ? $invoice->date->format('d.m.Y') : now()->format('d.m.Y') }}</span>
            </div>
            @if(isset($invoice->buyer->custom_fields['customer_id']))
                <div class="info-row">
                    <span class="info-label">Kunden-Nr.</span>
                    <span class="info-value">{{ $invoice->buyer->custom_fields['customer_id'] }}</span>
                </div>
            @endif
            @if(isset($invoice->buyer->custom_fields['due_date']))
                <div class="info-row">
                    <span class="info-label">Fällig am</span>
                    <span class="info-value">{{ $invoice->buyer->custom_fields['due_date'] }}</span>
                </div>
            @endif
        </div>

        <div class="content">
            <div class="title">{{ ($invoice->invoice_type ?? 'invoice') === 'credit_note' ? 'Gutschrift' : 'Rechnung' }} Nr. {{ $invoice->name }}</div>

            <div class="intro-text">
                Sehr geehrte Damen und Herren,<br><br>
                @if(($invoice->invoice_type ?? 'invoice') === 'credit_note')
                    wir erstellen Ihnen hiermit folgende Gutschrift:
                @else
                    wir stellen Ihnen hiermit folgende Leistungen in Rechnung:
                @endif
            </div>

            <!-- Items Table -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 45%">Beschreibung</th>
                        <th class="text-right" style="width: 15%">Menge</th>
                        <th class="text-right" style="width: 20%">Einzelpreis</th>
                        <th class="text-right" style="width: 20%">Gesamt</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($invoice->items as $item)
                        <tr>
                            <td>
                                <strong>{{ $item->title }}</strong>
                                @if($item->description)
                                    <br><span style="font-size: 8pt; color: #666;">{{ $item->description }}</span>
                                @endif
                            </td>
                            <td class="text-right">{{ $item->quantity }} {{ $item->units }}</td>
                            <td class="text-right">{{ $invoice->formatCurrency($item->price_per_unit) }}</td>
                            <td class="text-right">{{ $invoice->formatCurrency($item->sub_total_price) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Totals -->
            <div style="margin-left: auto; width: 50%;">
                <table class="totals-table">
                    <tr>
                        <td class="text-right">Nettosumme:</td>
                        <td class="text-right">{{ $invoice->formatCurrency($invoice->taxable_amount) }}</td>
                    </tr>
                    @if($invoice->tax_rate > 0)
                        <tr>
                            <td class="text-right">Umsatzsteuer {{ $invoice->tax_rate }}%:</td>
                            <td class="text-right">{{ $invoice->formatCurrency($invoice->total_taxes) }}</td>
                        </tr>
                    @endif
                    @if($invoice->shipping_amount > 0)
                        <tr>
                            <td class="text-right">Versandkosten:</td>
                            <td class="text-right">{{ $invoice->formatCurrency($invoice->shipping_amount) }}</td>
                        </tr>
                    @endif
                    @if($invoice->total_discount > 0)
                        <tr>
                            <td class="text-right">Rabatt:</td>
                            <td class="text-right">- {{ $invoice->formatCurrency($invoice->total_discount) }}</td>
                        </tr>
                    @endif
                    <tr class="total-row">
                        <td class="text-right">Gesamtbetrag:</td>
                        <td class="text-right">{{ $invoice->formatCurrency($invoice->total_amount) }}</td>
                    </tr>
                    @if(isset($invoice->buyer->custom_fields['paid_amount']) && (float)$invoice->buyer->custom_fields['paid_amount'] > 0)
                        <tr>
                            <td class="text-right">Abzüglich Anzahlung:</td>
                            <td class="text-right">- {{ $invoice->formatCurrency($invoice->buyer->custom_fields['paid_amount']) }}</td>
                        </tr>
                        <tr class="total-row" style="color: #d32f2f;">
                            <td class="text-right">Noch zu zahlender Betrag:</td>
                            <td class="text-right">{{ $invoice->formatCurrency((float)$invoice->total_amount - (float)$invoice->buyer->custom_fields['paid_amount']) }}</td>
                        </tr>
                    @endif
                </table>
            </div>

            <!-- Notes -->
            @if($invoice->notes)
                <div style="margin-top: 5mm; font-size: 9pt; color: #555;">
                    {!! nl2br(e($invoice->notes)) !!}
                </div>
            @endif

            <!-- Payment Info -->
            <div class="payment-info">
                <p>
                    Bitte überweisen Sie den Betrag von
                    <strong>{{ $invoice->formatCurrency($invoice->total_amount) }}</strong> bis zum
                    <strong>{{ $invoice->buyer->custom_fields['due_date'] ?? 'sofort' }}</strong>.<br>
                    Verwendungszweck: <strong>{{ $invoice->name }}</strong>
                </p>
                @if(isset($settings['bank_iban']))
                    <p>
                        <strong>Bankverbindung:</strong> {{ $settings['bank_name'] ?? 'Bank' }} | IBAN:
                        {{ $settings['bank_iban'] }} | BIC: {{ $settings['bank_bic'] ?? '' }}
                    </p>
                @endif
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-col">
                        <strong>{{ $companyName }}</strong><br>
                        {{ $settings['address_street'] ?? '' }} {{ $settings['address_house_no'] ?? '' }}<br>
                        {{ $settings['address_zip'] ?? '' }} {{ $settings['address_city'] ?? '' }}<br>
                        {{ $companyCountry }}
                    </td>
                    <td class="footer-col">
                        <strong>Kontakt</strong><br>
                        Email: {{ $settings['email'] ?? ($settings['mail_username'] ?? '-') }}<br>
                        Web: {{ $settings['website'] ?? '-' }}<br>
                    </td>
                    <td class="footer-col">
                        <strong>Steuer & Bank</strong><br>
                        St.-Nr.: {{ $settings['tax_number'] ?? '-' }}<br>
                        USt-ID: {{ $settings['vat_id'] ?? '-' }}<br>
                        IBAN: {{ $settings['bank_iban'] ?? '-' }}
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>

</html>