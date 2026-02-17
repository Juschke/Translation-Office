<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Rechnung {{ $invoice->name }}</title>
    <style>
        @page {
            margin: 20mm 20mm 30mm 25mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
        }

        /* ── Hilfsklassen ── */
        .text-right {
            text-align: right;
        }

        .font-bold {
            font-weight: bold;
        }

        /* ── DIN 5008 Falzmarken & Lochmarke ── */
        .fold-mark-top,
        .fold-mark-bottom,
        .punch-mark {
            position: fixed;
            left: -20mm;
            width: 4mm;
            border-top: 0.5pt solid #999;
        }

        /* Obere Falzmarke: 105mm vom oberen Blattrand */
        .fold-mark-top {
            top: 85mm; /* 105mm - 20mm page margin */
        }

        /* Lochmarke: 148.5mm vom oberen Blattrand */
        .punch-mark {
            top: 128.5mm; /* 148.5mm - 20mm page margin */
        }

        /* Untere Falzmarke: 210mm vom oberen Blattrand */
        .fold-mark-bottom {
            top: 190mm; /* 210mm - 20mm page margin */
        }

        /* ── Anschriftfeld DIN 5008 Form B ── */
        /* Beginnt bei 45mm vom oberen Blattrand = 25mm vom Content-Start */
        .address-field {
            position: relative;
            margin-top: 25mm;
            width: 85mm;
            height: 45mm;
        }

        /* Rücksendeangabe (Zusatz- und Vermerkzone) */
        .sender-small {
            font-size: 6.5pt;
            text-decoration: underline;
            color: #555;
            line-height: 1.2;
            height: 5mm;
            overflow: hidden;
        }

        /* Empfängeradresse */
        .recipient-address {
            margin-top: 1mm;
            font-size: 10pt;
            line-height: 1.3;
        }

        .recipient-address p {
            margin: 0;
        }

        /* ── Header-Bereich (Anschrift links, Info rechts) ── */
        .header-container {
            width: 100%;
            margin-bottom: 15mm;
        }

        .header-left {
            float: left;
            width: 85mm;
        }

        .info-box {
            float: right;
            width: 75mm;
            margin-top: 25mm;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 1mm 0;
            font-size: 8.5pt;
            border-bottom: 0.1mm solid #eee;
        }

        /* ── Titel & Einleitung ── */
        .content-body {
            clear: both;
            padding-top: 5mm;
        }

        .title {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 5mm;
        }

        .intro-text {
            margin-bottom: 6mm;
        }

        /* ── Positions-Tabelle ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }

        .items-table th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            text-align: left;
            padding: 2mm 1mm;
            font-size: 8.5pt;
        }

        .items-table td {
            padding: 2.5mm 1mm;
            border-bottom: 0.1mm solid #eee;
            vertical-align: top;
            font-size: 8.5pt;
        }

        /* ── Summen-Bereich ── */
        .totals-wrapper {
            float: right;
            width: 70mm;
            margin-top: 3mm;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 1.5mm 1mm;
            font-size: 9pt;
        }

        .total-brutto {
            border-top: 1px solid #000;
            font-weight: bold;
            font-size: 10pt;
        }

        /* ── Zahlungsbedingungen ── */
        .payment-terms {
            clear: both;
            margin-top: 12mm;
            font-size: 9pt;
        }

        .payment-terms p {
            margin: 0 0 3mm 0;
        }

        /* ── Footer (fixiert am Seitenende) ── */
        .footer {
            position: fixed;
            bottom: -20mm;
            left: 0;
            right: 0;
            width: 100%;
            border-top: 0.5pt solid #ccc;
            padding-top: 2mm;
            font-size: 7pt;
            line-height: 1.3;
            color: #444;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            vertical-align: top;
            padding: 0 2mm;
        }

        .footer-table td:first-child {
            padding-left: 0;
        }

        .footer-table td:last-child {
            padding-right: 0;
        }
    </style>
</head>

<body>

    @php
        $tId = $invoice->tenant_id ?? 1;
        $settings = \App\Models\TenantSetting::where('tenant_id', $tId)->pluck('value', 'key');
        $companyName = $settings['company_name'] ?? 'Amplicore GmbH';
        $fullAddressLine = ($settings['address_street'] ?? 'Sandkamp 1') . ' · ' . ($settings['address_zip'] ?? '22111') . ' ' . ($settings['address_city'] ?? 'Hamburg');
    @endphp

    {{-- DIN 5008 Falzmarken und Lochmarke --}}
    <div class="fold-mark-top"></div>
    <div class="punch-mark"></div>
    <div class="fold-mark-bottom"></div>

    {{-- Footer (muss im DOM vor dem Content stehen für dompdf fixed positioning) --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td style="width: 30%;">
                    <strong>{{ $companyName }}</strong><br>
                    {{ $settings['address_street'] ?? 'Sandkamp 1' }}<br>
                    {{ $settings['address_zip'] ?? '22111' }} {{ $settings['address_city'] ?? 'Hamburg' }}<br>
                    @if(!empty($settings['tax_number']))
                        Steuer-Nr.: {{ $settings['tax_number'] }}<br>
                    @endif
                    @if(!empty($settings['vat_id']))
                        USt-IdNr.: {{ $settings['vat_id'] }}
                    @endif
                </td>
                <td style="width: 30%;">
                    <strong>Kontakt</strong><br>
                    @if(!empty($settings['phone']))
                        Tel: {{ $settings['phone'] }}<br>
                    @endif
                    @if(!empty($settings['email']))
                        {{ $settings['email'] }}<br>
                    @elseif(!empty($settings['company_email']))
                        {{ $settings['company_email'] }}<br>
                    @endif
                    @if(!empty($settings['website']))
                        {{ $settings['website'] }}
                    @endif
                </td>
                <td style="width: 40%;">
                    <strong>Bankverbindung</strong><br>
                    @if(!empty($settings['bank_name']))
                        {{ $settings['bank_name'] }}<br>
                    @endif
                    @if(!empty($settings['bank_iban']))
                        IBAN: {{ $settings['bank_iban'] }}<br>
                    @endif
                    @if(!empty($settings['bank_bic']))
                        BIC: {{ $settings['bank_bic'] }}
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- Header: Anschriftfeld + Informationsblock --}}
    <div class="header-container">
        <div class="header-left">
            <div class="address-field">
                <div class="sender-small">{{ $companyName }} · {{ $fullAddressLine }}</div>
                <div class="recipient-address">
                    <p>
                        <strong>{{ $invoice->buyer->name }}</strong><br>
                        @if(isset($invoice->buyer->custom_fields['address']))
                            {!! nl2br(e($invoice->buyer->custom_fields['address'])) !!}
                        @else
                            {{ $invoice->buyer->custom_fields['street'] ?? '' }}<br>
                            {{ $invoice->buyer->custom_fields['zip'] ?? '' }}
                            {{ $invoice->buyer->custom_fields['city'] ?? '' }}<br>
                            {{ $invoice->buyer->custom_fields['country'] ?? 'Deutschland' }}
                        @endif
                    </p>
                </div>
            </div>
        </div>

        <div class="info-box">
            <table class="info-table">
                <tr>
                    <td class="font-bold">Rechnungs-Nr.</td>
                    <td class="text-right">{{ $invoice->name }}</td>
                </tr>
                <tr>
                    <td class="font-bold">Rechnungsdatum</td>
                    <td class="text-right">{{ $invoice->date ? $invoice->date->format('d.m.Y') : now()->format('d.m.Y') }}</td>
                </tr>
                @if(isset($invoice->buyer->custom_fields['reference']))
                    <tr>
                        <td class="font-bold">Referenz</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['reference'] }}</td>
                    </tr>
                @endif
                @if(isset($invoice->buyer->custom_fields['service_period']))
                    <tr>
                        <td class="font-bold">Leistungszeitraum</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['service_period'] }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="font-bold">Kundennummer</td>
                    <td class="text-right">{{ $invoice->buyer->custom_fields['customer_id'] ?? '' }}</td>
                </tr>
                @if(isset($invoice->buyer->custom_fields['due_date']))
                    <tr>
                        <td class="font-bold">Fälligkeitsdatum</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['due_date'] }}</td>
                    </tr>
                @endif
            </table>
        </div>
    </div>

    {{-- Rechnungsinhalt --}}
    <div class="content-body">
        @php
            $docTitle = ($invoice->invoice_type ?? 'invoice') === 'credit_note'
                ? 'Gutschrift Nr. ' . $invoice->name
                : 'Rechnung Nr. ' . $invoice->name;
        @endphp
        <div class="title">{{ $docTitle }}</div>

        <div class="intro-text">
            Sehr geehrte Damen und Herren,<br>
            @if(($invoice->invoice_type ?? 'invoice') === 'credit_note')
                hiermit erhalten Sie die folgende Gutschrift:
            @else
                vielen Dank für Ihren Auftrag! Hiermit stellen wir Ihnen die folgenden Leistungen in Rechnung:
            @endif
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%">Beschreibung</th>
                    <th class="text-right" style="width: 10%">Menge</th>
                    <th class="text-right" style="width: 20%">Einzelpreis</th>
                    <th class="text-right" style="width: 20%">Gesamtpreis</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item->title }}</strong>
                            @if($item->description)
                                <br><span style="font-size: 7.5pt; color: #666;">{{ $item->description }}</span>
                            @endif
                        </td>
                        <td class="text-right">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                        <td class="text-right">{{ number_format($item->price_per_unit, 2, ',', '.') }} €</td>
                        <td class="text-right">{{ number_format($item->sub_total_price, 2, ',', '.') }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-wrapper">
            <table class="totals-table">
                <tr>
                    <td class="text-right">Nettobetrag:</td>
                    <td class="text-right">{{ number_format($invoice->taxable_amount, 2, ',', '.') }} €</td>
                </tr>
                @if($invoice->total_taxes > 0)
                    <tr>
                        <td class="text-right">USt. {{ number_format($invoice->tax_rate ?? 19, 0) }}%:</td>
                        <td class="text-right">{{ number_format($invoice->total_taxes, 2, ',', '.') }} €</td>
                    </tr>
                @endif
                <tr class="total-brutto">
                    <td class="text-right">Bruttobetrag:</td>
                    <td class="text-right">{{ number_format($invoice->total_amount, 2, ',', '.') }} €</td>
                </tr>
            </table>
        </div>

        <div class="payment-terms">
            @if($invoice->notes)
                <p>{!! nl2br(e($invoice->notes)) !!}</p>
            @endif

            <p>
                <strong>Zahlungsbedingungen:</strong> Zahlung innerhalb von 14 Tagen ab Rechnungseingang ohne Abzüge.
                @if(isset($invoice->buyer->custom_fields['due_date']))
                    <br>Der Rechnungsbetrag ist bis zum <strong>{{ $invoice->buyer->custom_fields['due_date'] }}</strong> fällig.
                @endif
            </p>
            <p>Bitte überweisen Sie den Betrag auf das unten angegebene Konto unter Angabe der Rechnungsnummer.</p>
            <p>Mit freundlichen Grüßen,<br>{{ $settings['ceo_name'] ?? $companyName }}</p>
        </div>
    </div>

</body>

</html>
