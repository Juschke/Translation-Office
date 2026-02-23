<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Auftragsbestätigung {{ $project->project_number ?? $project->id }}</title>
    <style>
        @page {
            margin: 20mm 20mm 30mm 25mm;
        }

        body {
            font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
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

        /* DIN 5008 Markierungen */
        .fold-mark-top,
        .fold-mark-bottom,
        .punch-mark {
            position: fixed;
            left: -20mm;
            width: 4mm;
            border-top: 0.5pt solid #000;
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
            color: #000;
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
            padding: 1.2mm 0;
            font-size: 8.5pt;
            border-bottom: 0.5pt solid #000;
        }

        .info-table td:first-child {
            font-weight: bold;
        }

        .content-body {
            clear: both;
            padding-top: 2mm;
        }

        .title {
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 4mm;
            text-transform: uppercase;
        }

        .intro-text {
            margin-bottom: 5mm;
        }

        /* Tabelle */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }

        .items-table th {
            border-top: 1.5pt solid #000;
            border-bottom: 1.5pt solid #000;
            text-align: right;
            padding: 3mm 1.5mm;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .items-table td {
            padding: 3mm 1.5mm;
            border-bottom: 0.5pt solid #000;
            vertical-align: top;
            font-size: 9pt;
        }

        .totals-wrapper {
            float: right;
            width: 80mm;
            margin-top: 4mm;
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
            border-top: 1.5pt solid #000;
            font-weight: bold;
            font-size: 10pt;
        }

        .footer {
            position: fixed;
            bottom: -20mm;
            left: 0;
            right: 0;
            width: 100%;
            border-top: 1pt solid #000;
            padding-top: 3mm;
            font-size: 7.5pt;
            line-height: 1.4;
            color: #000;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            vertical-align: top;
            padding: 0 2mm;
        }

        .footer-label {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7pt;
            margin-bottom: 1.5mm;
            display: block;
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
                <td style="width: 33%;">
                    <span class="footer-label">Anschrift</span>
                    <strong>{{ $companyName }}</strong><br>
                    {{ $tenant->address_street }} {{ $tenant->address_house_no }}<br>
                    {{ $tenant->address_zip }} {{ $tenant->address_city }}
                </td>
                <td style="width: 33%; text-align: left;">
                    <span class="footer-label">Kontakt</span>
                    Tel: {{ $tenant->phone }}<br>
                    Email: {{ $tenant->email }}<br>
                    Web: {{ $tenant->domain ?? $tenant->website }}
                </td>
                <td style="width: 34%;">
                    <span class="footer-label">Bank & Steuer</span>
                    @if($tenant->bank_name)
                        {{ $tenant->bank_name }}@if($tenant->bank_bic) | BIC: {{ $tenant->bank_bic }}@endif<br>
                        @if($tenant->bank_code) BLZ: {{ $tenant->bank_code }}<br>@endif
                    @endif
                    @if($tenant->bank_iban)
                        IBAN: {{ $tenant->bank_iban }}<br>
                    @endif
                    @if($tenant->vat_id)
                        USt-IdNr.: {{ $tenant->vat_id }}<br>
                    @endif
                    @if($tenant->tax_number)
                        St.-Nr.: {{ $tenant->tax_number }}
                    @endif
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
                    <td>Belegart</td>
                    <td class="text-right">Auftragsbestätigung</td>
                </tr>
                <tr>
                    <td>Datum</td>
                    <td class="text-right">{{ date('d.m.Y') }}</td>
                </tr>
                <tr>
                    <td>Projekt-Nr.</td>
                    <td class="text-right">{{ $project->project_number ?? $project->id }}</td>
                </tr>
                <tr>
                    <td>Kunden-Nr.</td>
                    <td class="text-right">{{ $project->customer->customer_number ?? $project->customer->id }}</td>
                </tr>
                @if($project->deadline)
                    <tr>
                        <td>Liefertermin</td>
                        <td class="text-right">{{ \Carbon\Carbon::parse($project->deadline)->format('d.m.Y') }}</td>
                    </tr>
                @endif
            </table>
        </div>
    </div>

    <div class="content-body">
        <div class="title">Auftragsbestätigung: {{ $project->project_name }}</div>

        <div class="intro-text">
            Sehr geehrte Damen und Herren,<br><br>
            vielen Dank für Ihren Auftrag. Hiermit bestätigen wir die Annahme des Projekts zu den folgenden Konditionen:
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%; text-align: left;">Bezeichnung</th>
                    <th style="width: 10%">Menge</th>
                    <th style="width: 20%">Einzelpreis</th>
                    <th style="width: 20%">Gesamtpreis</th>
                </tr>
            </thead>
            <tbody>
                @foreach($project->positions as $pos)
                    <tr>
                        <td>
                            <strong>{{ $pos->description }}</strong><br>
                            <span style="font-size: 7.5pt; color: #000;">
                                {{ $project->sourceLanguage->name }} →
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
                    <td class="text-right">zzgl. 19% USt.:</td>
                    <td class="text-right">{{ number_format($project->price_total * 0.19, 2, ',', '.') }} €</td>
                </tr>
                <tr class="total-brutto">
                    <td class="text-right">Gesamtbetrag:</td>
                    <td class="text-right">{{ number_format($project->price_total * 1.19, 2, ',', '.') }} €</td>
                </tr>
            </table>
        </div>

        <div style="clear: both; margin-top: 15mm;">
            <p>Wir beginnen umgehend mit der Bearbeitung. Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Mit freundlichen Grüßen,<br><br><strong>{{ $companyName }}</strong></p>
        </div>
    </div>
</body>

</html>