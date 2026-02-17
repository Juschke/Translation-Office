<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Rechnung {{ $invoice->name }}</title>
    <style>
        @page {
            margin: 25mm 20mm 45mm 20mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
        }

        /* Hilfsklassen */
        .text-right {
            text-align: right;
        }

        .font-bold {
            font-weight: bold;
        }

        /* Absenderzeile über der Empfängeradresse */
        .sender-small {
            font-size: 7pt;
            text-decoration: underline;
            color: #555;
            margin-bottom: 2mm;
        }

        /* Header-Bereich (Empfänger links, Info-Tabelle rechts) */
        .header-container {
            width: 100%;
            margin-top: 10mm;
            margin-bottom: 20mm;
        }

        .recipient-box {
            float: left;
            width: 85mm;
        }

        .recipient-box p {
            margin: 0;
            font-size: 10pt;
        }

        .info-box {
            float: right;
            width: 75mm;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 1mm 0;
            font-size: 9pt;
            border-bottom: 0.1mm solid #eee;
        }

        /* Titel & Einleitung */
        .content-body {
            clear: both;
            padding-top: 10mm;
        }

        .title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5mm;
        }

        .intro-text {
            margin-bottom: 8mm;
        }

        /* Positions-Tabelle */
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
            font-size: 9pt;
        }

        .items-table td {
            padding: 3mm 1mm;
            border-bottom: 0.1mm solid #eee;
            vertical-align: top;
        }

        /* Summen-Bereich */
        .totals-wrapper {
            float: right;
            width: 70mm;
            margin-top: 5mm;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 1.5mm 1mm;
        }

        .total-brutto {
            border-top: 1px solid #000;
            font-weight: bold;
            font-size: 10pt;
        }

        /* Zahlungsbedingungen */
        .payment-terms {
            clear: both;
            margin-top: 15mm;
            font-size: 9pt;
        }

        /* Footer */
        .footer {
            position: fixed;
            top: 500mm;
            left: 0;
            right: 0;
            width: 100%;
            border-top: 0.5pt solid #ccc;
            padding-top: 3mm;
            font-size: 8pt;
            color: #444;
        }

        .footer table {
            width: 100%;
        }

        .footer td {
            width: 33%;
            vertical-align: top;
        }
    </style>
</head>

<body>

    @php
        $tId = $invoice->tenant_id ?? 1;
        $settings = \App\Models\TenantSetting::where('tenant_id', $tId)->pluck('value', 'key');
        $companyName = $settings['company_name'] ?? 'Amplicore GmbH';
        $fullAddressLine = ($settings['address_street'] ?? 'Sandkamp 1') . ' • ' . ($settings['address_zip'] ?? '22111') . ' ' . ($settings['address_city'] ?? 'Hamburg');
    @endphp

    <div class="header-container">
        <div class="recipient-box">
            <div class="sender-small">{{ $companyName }} • {{ $fullAddressLine }}</div>
            <p>
                <strong>{{ $invoice->buyer->name }}</strong><br>
                @if(isset($invoice->buyer->custom_fields['address']))
                    {!! nl2br(e($invoice->buyer->custom_fields['address'])) !!}
                @else
                    {{ $invoice->buyer->custom_fields['street'] ?? 'Barkhausenstr.60' }}<br>
                    {{ $invoice->buyer->custom_fields['zip'] ?? '27568' }}
                    {{ $invoice->buyer->custom_fields['city'] ?? 'Bremerhaven' }}<br>
                    {{ $invoice->buyer->custom_fields['country'] ?? 'Deutschland' }}
                @endif
            </p>
        </div>

        <div class="info-box">
            <table class="info-table">
                <tr>
                    <td class="font-bold">Rechnungs-Nr.</td>
                    <td class="text-right">{{ $invoice->name ?? 'RE-2025-20' }}</td>
                </tr>
                <tr>
                    <td class="font-bold">Rechnungsdatum</td>
                    <td class="text-right">{{ $invoice->date ? $invoice->date->format('d.m.Y') : '17.12.2025' }} </td>
                </tr>
                @if(isset($invoice->buyer->custom_fields['reference']))
                    <tr>
                        <td class="font-bold">Referenz</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['reference'] ?? '8069014-380306' }} </td>
                    </tr>
                @endif
                <tr>
                    <td class="font-bold">Leistungszeitraum</td>
                    <td class="text-right">01.12.2025-12.12.2025 </td>
                </tr>
                <tr>
                    <td class="font-bold">Kundennummer</td>
                    <td class="text-right">{{ $invoice->buyer->custom_fields['customer_id'] ?? '2025-1' }} </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="content-body">
        <div class="title">Rechnung Nr. {{ $invoice->name ?? 'RE-2025-20' }} [cite: 6]</div>

        <div class="intro-text">
            Sehr geehrte Damen und Herren, [cite: 7]<br>
            vielen Dank für Ihren Auftrag! Hiermit stelle ich Ihnen die folgenden Leistungen in Rechnung: [cite: 8]
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
                            <strong>{{ $item->title ?? 'LED-Umrüstung Airbus - Fuhlsbüttel' }}</strong> <br>
                            <span
                                style="font-size: 8pt; color: #666;">{{ $item->description ?? 'Zeitraum 01.12.2025-12.12.2025' }}</span>
                        </td>
                        <td class="text-right">{{ number_format($item->quantity ?? 1, 2, ',', '.') }} Stk </td>
                        <td class="text-right">{{ number_format($item->price_per_unit ?? 15980, 2, ',', '.') }} EUR </td>
                        <td class="text-right">{{ number_format($item->sub_total_price ?? 15980, 2, ',', '.') }} EUR </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-wrapper">
            <table class="totals-table">
                <tr>
                    <td class="text-right">Gesamtbetrag netto:</td>
                    <td class="text-right">{{ number_format($invoice->taxable_amount ?? 15980, 2, ',', '.') }} EUR </td>
                </tr>
                <tr>
                    <td class="text-right">Umsatzsteuer 19%:</td>
                    <td class="text-right">{{ number_format($invoice->total_taxes ?? 3036.20, 2, ',', '.') }} EUR </td>
                </tr>
                <tr class="total-brutto">
                    <td class="text-right">Gesamtbetrag brutto:</td>
                    <td class="text-right">{{ number_format($invoice->total_amount ?? 19016.20, 2, ',', '.') }} EUR
                    </td>
                </tr>
            </table>
        </div>

        <div class="payment-terms">
            <p>
                <strong>Zahlungsbedingungen:</strong> Zahlung innerhalb von 14 Tagen ab Rechnungseingang ohne
                Abzüge.<br>
                Der Rechnungsbetrag ist bis zum <strong>{{ $invoice->due_date ?? '31.12.2025' }}</strong> fällig.
            </p>
            <p>Bitte überweisen Sie den Betrag auf das unten angegebene Konto unter Angabe der Rechnungsnummer.</p>
            <p>Mit freundlichen Grüßen,<br>{{ $settings['ceo_name'] ?? 'Gerrit Schulz' }}</p>
        </div>
    </div>

    <div class="footer">
        <table>
            <tr>
                <td>
                    <strong>{{ $companyName }}</strong><br>
                    {{ $settings['address_street'] ?? 'Sandkamp 1' }}<br>
                    {{ $settings['address_zip'] ?? '22111' }} {{ $settings['address_city'] ?? 'Hamburg' }}
                </td>
                <td>
                    <strong>Kontakt</strong><br>
                    Tel: {{ $settings['phone'] ?? '+49 1709071286' }}<br>
                    E-Mail: {{ $settings['email'] ?? 'info@amplicore.de' }}
                </td>
                <td>
                    <strong>Bankverbindung</strong><br>
                    Bank: {{ $settings['bank_name'] ?? 'Volksbank' }}<br>
                    IBAN: {{ $settings['bank_iban'] ?? 'DE60292627220208678600' }}<br>
                    BIC: {{ $settings['bank_bic'] ?? 'GENODEF1BRV' }}
                </td>
            </tr>
        </table>
    </div>

</body>

</html>