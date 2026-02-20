<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Abholbestätigung {{ $project->project_number ?? $project->id }}</title>
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

        .text-right {
            text-align: right;
        }

        .font-bold {
            font-weight: bold;
        }

        /* DIN 5008 Markierungen */
        .fold-mark-top,
        .fold-mark-bottom,
        .punch-mark {
            position: fixed;
            left: -20mm;
            width: 4mm;
            border-top: 0.5pt solid #999;
        }

        .fold-mark-top {
            top: 85mm;
        }

        .punch-mark {
            top: 128.5mm;
        }

        .fold-mark-bottom {
            top: 190mm;
        }

        /* Anschriftfeld */
        .address-field {
            position: relative;
            margin-top: 15mm;
            width: 85mm;
        }

        .sender-small {
            font-size: 6.5pt;
            text-decoration: underline;
            color: #555;
            line-height: 1.2;
            height: 5mm;
            overflow: hidden;
        }

        .recipient-address {
            margin-top: 1mm;
            font-size: 10pt;
            line-height: 1.3;
        }

        .recipient-address p {
            margin: 0;
        }

        /* Header Info Box */
        .header-container {
            width: 100%;
            margin-bottom: 8mm;
        }

        .header-left {
            float: left;
            width: 85mm;
        }

        .info-box {
            float: right;
            width: 75mm;
            margin-top: 15mm;
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

        .content-body {
            clear: both;
            padding-top: 2mm;
        }

        .title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 3mm;
        }

        .intro-text {
            margin-bottom: 4mm;
        }

        /* Tabelle */
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
            padding: 1.5mm 1mm;
            border-bottom: 0.1mm solid #eee;
            vertical-align: top;
            font-size: 8.5pt;
        }

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

        /* Unterschriften */
        .signature-container {
            margin-top: 20mm;
            width: 100%;
            clear: both;
        }

        .signature-box {
            width: 45%;
            float: left;
        }

        .signature-line {
            border-bottom: 0.5pt solid #000;
            height: 15mm;
            margin-bottom: 1mm;
        }

        .signature-label {
            font-size: 7.5pt;
            color: #666;
        }
    </style>
</head>

<body>
    @php
        $tenant = $project->tenant;
        $companyName = $tenant->company_name;
        $fullAddressLine = $tenant->address_street . ' ' . $tenant->address_house_no . ' · ' . $tenant->address_zip . ' ' . $tenant->address_city;
    @endphp

    <div class="fold-mark-top"></div>
    <div class="punch-mark"></div>
    <div class="fold-mark-bottom"></div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td style="width: 30%;">
                    <strong>{{ $companyName }}</strong><br>
                    {{ $tenant->address_street }} {{ $tenant->address_house_no }}<br>
                    {{ $tenant->address_zip }} {{ $tenant->address_city }}<br>
                    Steuer-Nr.: {{ $tenant->tax_number }}<br>
                    USt-IdNr.: {{ $tenant->vat_id }}
                </td>
                <td style="width: 30%;">
                    <strong>Kontakt</strong><br>
                    Tel: {{ $tenant->phone }}<br>
                    {{ $tenant->email }}<br>
                    {{ $tenant->domain ?? $tenant->website }}
                </td>
                <td style="width: 40%;">
                    <strong>Bankverbindung</strong><br>
                    {{ $tenant->bank_name }}<br>
                    IBAN: {{ $tenant->bank_iban }}<br>
                    BIC: {{ $tenant->bank_bic }}
                </td>
            </tr>
        </table>
    </div>

    <div class="header-container">
        <div class="header-left">
            <div class="address-field">
                <div class="sender-small">{{ $companyName }} · {{ $fullAddressLine }}</div>
                <div class="recipient-address">
                    <p>
                        <strong>{{ $project->customer->company_name }}</strong><br>
                        @if($project->customer->contact_person) z.Hd. {{ $project->customer->contact_person }}<br>
                        @endif
                        {{ $project->customer->address_street }} {{ $project->customer->address_house_no }}<br>
                        {{ $project->customer->address_zip }} {{ $project->customer->address_city }}<br>
                        {{ $project->customer->address_country }}
                    </p>
                </div>
            </div>
        </div>

        <div class="info-box">
            <table class="info-table">
                <tr>
                    <td class="font-bold">Belegart</td>
                    <td class="text-right">Abholbestätigung</td>
                </tr>
                <tr>
                    <td class="font-bold">Datum</td>
                    <td class="text-right">{{ date('d.m.Y') }}</td>
                </tr>
                <tr>
                    <td class="font-bold">Projekt-Nr.</td>
                    <td class="text-right">{{ $project->project_number ?? $project->id }}</td>
                </tr>
                <tr>
                    <td class="font-bold">Abholung von</td>
                    <td class="text-right">{{ $project->customer->contact_person ?: $project->customer->company_name }}
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="content-body">
        <div class="title">Abholbestätigung / Lieferschein: {{ $project->project_name }}</div>

        <div class="intro-text">
            Hiermit bestätigen wir, dass der Kunde die folgenden Dokumente/Leistungen erhalten hat:
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
                @foreach($project->positions as $pos)
                    <tr>
                        <td>
                            <strong>{{ $pos->description }}</strong><br>
                            <span style="font-size: 7.5pt; color: #666;">
                                {{ $project->sourceLanguage->name }} <span style="font-family: DejaVu Sans;">→</span>
                                {{ $project->targetLanguage->name }}
                                @if($pos->document_type) • {{ $pos->document_type }} @endif
                            </span>
                        </td>
                        <td class="text-right">{{ number_format($pos->quantity, 2, ',', '.') }} {{ $pos->unit }}</td>
                        <td class="text-right">{{ number_format($pos->customer_rate, 2, ',', '.') }} €</td>
                        <td class="text-right">{{ number_format($pos->customer_total, 2, ',', '.') }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-wrapper">
            <table class="totals-table">
                <tr>
                    <td class="text-right">Nettobetrag:</td>
                    <td class="text-right">{{ number_format($project->price_total, 2, ',', '.') }} €</td>
                </tr>
                <tr>
                    <td class="text-right">USt. 19%:</td>
                    <td class="text-right">{{ number_format($project->price_total * 0.19, 2, ',', '.') }} €</td>
                </tr>
                <tr class="total-brutto">
                    <td class="text-right">Gesamtbetrag:</td>
                    <td class="text-right">{{ number_format($project->price_total * 1.19, 2, ',', '.') }} €</td>
                </tr>
            </table>
        </div>

        <div class="signature-container">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Ort, Datum, Unterschrift {{ $companyName }}</div>
            </div>
            <div class="signature-box" style="float: right;">
                <div class="signature-line"></div>
                <div class="signature-label">Ort, Datum, Unterschrift Kunde / Empfänger</div>
            </div>
            <div style="clear: both;"></div>
        </div>
    </div>
</body>

</html>