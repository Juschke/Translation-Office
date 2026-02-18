<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Abholbestätigung</title>
    <!-- Same styles as order confirmation -->
    <style>
        body {
            font-family: sans-serif;
            font-size: 10pt;
            color: #333;
        }

        .header {
            width: 100%;
            border-bottom: 3px solid
                {{ $project->tenant->primary_color ?? '#e2e8f0' }}
            ;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header table {
            width: 100%;
        }

        .logo {
            max-height: 80px;
        }

        .company-info {
            text-align: right;
            font-size: 9pt;
            color: #666;
        }

        .address-block {
            float: left;
            width: 45%;
            margin-bottom: 40px;
        }

        .meta-block {
            float: right;
            width: 45%;
            text-align: right;
        }

        .meta-table {
            width: 100%;
            text-align: right;
        }

        .meta-table td {
            padding: 2px 0;
        }

        .meta-label {
            font-weight: bold;
            color: #666;
        }

        .clear {
            clear: both;
        }

        h1 {
            font-size: 18pt;
            margin-bottom: 5px;
            color:
                {{ $project->tenant->primary_color ?? '#1e293b' }}
            ;
        }

        .subtitle {
            font-size: 12pt;
            margin-bottom: 20px;
            color: #666;
        }

        .content {
            margin-bottom: 30px;
            line-height: 1.5;
        }

        table.positions {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        table.positions th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 10px;
            text-align: left;
            font-size: 9pt;
            text-transform: uppercase;
            color: #64748b;
        }

        table.positions td {
            border-bottom: 1px solid #f1f5f9;
            padding: 10px;
            vertical-align: top;
        }

        table.positions td.num {
            text-align: right;
            white-space: nowrap;
        }

        .totals {
            width: 100%;
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .totals td {
            padding: 5px 10px;
            text-align: right;
        }

        .totals .label {
            font-weight: bold;
            color: #666;
        }

        .totals .amount {
            width: 120px;
        }

        .totals .final-row td {
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            padding: 10px;
            font-weight: bold;
            font-size: 12pt;
            color:
                {{ $project->tenant->primary_color ?? '#1e293b' }}
            ;
        }

        .signature-sections {
            margin-top: 50px;
            width: 100%;
        }

        .signature-sections td {
            width: 45%;
            border-top: 1px dotted #000;
            padding-top: 5px;
            font-size: 8pt;
            color: #999;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
        }

        .footer-cols {
            width: 100%;
            table-layout: fixed;
        }

        .footer-cols td {
            vertical-align: top;
            padding: 0 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <table>
            <tr>
                <td valign="top">
                    @if($project->tenant->logo_url)
                        <img src="{{ $project->tenant->logo_url }}" class="logo" />
                    @else
                        <h2 style="margin:0; color: {{ $project->tenant->primary_color ?? '#000' }}">
                            {{ $project->tenant->company_name }}</h2>
                    @endif
                </td>
                <td class="company-info" valign="top">
                    <strong>{{ $project->tenant->company_name }}</strong><br>
                    {{ $project->tenant->address_street }} {{ $project->tenant->address_house_no }}<br>
                    {{ $project->tenant->address_zip }} {{ $project->tenant->address_city }}<br>
                    {{ $project->tenant->email }} | {{ $project->tenant->phone }}
                </td>
            </tr>
        </table>
    </div>

    <div class="address-block">
        <div style="font-size: 7pt; color: #aaa; margin-bottom: 5px; text-decoration: underline;">
            {{ $project->tenant->company_name }} • {{ $project->tenant->address_street }}
            {{ $project->tenant->address_house_no }} • {{ $project->tenant->address_zip }}
            {{ $project->tenant->address_city }}
        </div>
        <strong>{{ $project->customer->company_name }}</strong><br>
        @if($project->customer->contact_person) z.Hd. {{ $project->customer->contact_person }}<br> @endif
        {{ $project->customer->address_street }} {{ $project->customer->address_house_no }}<br>
        {{ $project->customer->address_zip }} {{ $project->customer->address_city }}<br>
        {{ $project->customer->address_country }}
    </div>

    <div class="meta-block">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Datum:</td>
                <td>{{ date('d.m.Y') }}</td>
            </tr>
            <tr>
                <td class="meta-label">Abholung von:</td>
                <td><strong>{{ $project->customer->contact_person ?: $project->customer->company_name }}</strong></td>
            </tr>
            <tr>
                <td class="meta-label">Projekt-Nr.:</td>
                <td><strong>{{ $project->project_number ?? $project->id }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="clear"></div>

    <div style="margin-top: 40px;">
        <h1>Abholbestätigung / Lieferschein</h1>
        <div class="subtitle">Bestätigung zum Projekt: {{ $project->project_name }}</div>
    </div>

    <div class="content">
        <p>Hiermit bestätigen wir, dass der Kunde die folgenden Dokumente/Leistungen erhalten hat:</p>
    </div>

    <table class="positions">
        <thead>
            <tr>
                <th width="5%">Pos.</th>
                <th width="45%">Beschreibung</th>
                <th width="15%" class="num">Menge / Einh.</th>
                <th width="15%" class="num">Einzelpreis</th>
                <th width="20%" class="num">Gesamtpreis</th>
            </tr>
        </thead>
        <tbody>
            @foreach($project->positions as $index => $pos)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $pos->description }}</strong><br>
                        <span style="font-size: 8pt; color: #666;">
                            {{ $project->sourceLanguage->name }} <span style="font-family: DejaVu Sans;">→</span>
                            {{ $project->targetLanguage->name }}
                            @if($pos->document_type) • {{ $pos->document_type }} @endif
                        </span>
                    </td>
                    <td class="num">
                        {{ number_format($pos->quantity, 2, ',', '.') }}<br>
                        <span style="font-size: 8pt; color: #999;">{{ $pos->unit }}</span>
                    </td>
                    <td class="num">{{ number_format($pos->customer_rate, 2, ',', '.') }} €</td>
                    <td class="num">{{ number_format($pos->customer_total, 2, ',', '.') }} €</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" align="right">
        <tr>
            <td class="label">Nettosumme:</td>
            <td class="amount">{{ number_format($project->price_total, 2, ',', '.') }} €</td>
        </tr>
        <tr>
            <td class="label">Umsatzsteuer 19%:</td>
            <td class="amount">{{ number_format($project->price_total * 0.19, 2, ',', '.') }} €</td>
        </tr>
        <tr class="final-row">
            <td>Gesamtsumme:</td>
            <td class="amount">{{ number_format($project->price_total * 1.19, 2, ',', '.') }} €</td>
        </tr>
    </table>

    <div class="clear"></div>

    <table class="signature-sections">
        <tr>
            <td>
                Ort, Datum ({{ date('d.m.Y') }})<br><br><br>
                Unterschrift {{ $project->tenant->company_name }}
            </td>
            <td align="right">
                Ort, Datum ({{ date('d.m.Y') }})<br><br><br>
                Unterschrift Kunde / Empfänger
            </td>
        </tr>
    </table>

    <div class="footer">
        <table class="footer-cols">
            <tr>
                <td>
                    <strong>Anschrift</strong><br>
                    {{ $project->tenant->company_name }}<br>
                    {{ $project->tenant->address_street }} {{ $project->tenant->address_house_no }}<br>
                    {{ $project->tenant->address_zip }} {{ $project->tenant->address_city }}
                </td>
                <td>
                    <strong>Kontakt</strong><br>
                    Tel: {{ $project->tenant->phone }}<br>
                    Mail: {{ $project->tenant->email }}<br>
                    Web: {{ $project->tenant->domain ?? $project->tenant->website }}<br>
                    @if($project->tenant->opening_hours)
                    <span style="font-size: 7pt;">{{ $project->tenant->opening_hours }}</span>
                    @endif
                </td>
                <td>
                    <strong>Bankverbindung</strong><br>
                    IBAN: {{ $project->tenant->bank_iban }}<br>
                    BIC: {{ $project->tenant->bank_bic }}<br>
                    Bank: {{ $project->tenant->bank_name }}
                </td>
                <td>
                    <strong>Register</strong><br>
                    USt-ID: {{ $project->tenant->vat_id }}<br>
                    St-Nr.: {{ $project->tenant->tax_number }}<br>
                    Amtsgericht: {{ $project->tenant->register_court ?? '' }}
                </td>
            </tr>
        </table>
    </div>
</body>

</html>