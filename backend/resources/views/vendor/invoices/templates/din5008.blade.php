<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Rechnung {{ $invoice->name }}</title>
    @php
        // Resolve design variables with sensible defaults
        $tenantId = $invoice->buyer->custom_fields['tenant_id'] ?? null;
        if (!isset($fontFamily)) {
            $fontFamily = $tenantId
                ? (\App\Models\TenantSetting::where('tenant_id', $tenantId)->where('key', 'invoice_font_family')->value('value') ?? "'Inter', Helvetica, Arial, sans-serif")
                : "'Inter', Helvetica, Arial, sans-serif";
        }
        if (!isset($fontSize)) {
            $fontSize = $tenantId
                ? (\App\Models\TenantSetting::where('tenant_id', $tenantId)->where('key', 'invoice_font_size')->value('value') ?? '9pt')
                : '9pt';
        }
        if (!isset($primaryColor)) {
            $primaryColor = $tenantId
                ? (\App\Models\TenantSetting::where('tenant_id', $tenantId)->where('key', 'invoice_primary_color')->value('value') ?? '#000000')
                : '#000000';
        }
        if (!isset($companyLogo)) {
            $companyLogo = null;
            if ($tenantId) {
                $companyLogo = \App\Models\TenantSetting::where('tenant_id', $tenantId)->where('key', 'company_logo')->value('value');
            }
        }
    @endphp
    <style>
        @page {
            margin: 20mm 20mm 30mm 25mm;
        }

        body {
            font-family:
                {{ $fontFamily }}
            ;
            font-size:
                {{ $fontSize }}
            ;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
        }

        .accent-color {
            color:
                {{ $primaryColor }}
            ;
        }

        .accent-border {
            border-color:
                {{ $primaryColor }}
            ;
        }

        .company-logo {
            max-height: 18mm;
            max-width: 50mm;
            object-fit: contain;
        }

        /* ── Hilfsklassen ── */
        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .text-muted {
            color: #000;
        }

        .text-small {
            font-size: 7.5pt;
            color: #000;
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

        .fold-mark-top {
            top: 85mm;
        }

        .punch-mark {
            top: 128.5mm;
        }

        .fold-mark-bottom {
            top: 190mm;
        }

        /* ── Anschriftfeld DIN 5008 Form B ── */
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

        /* ── Header-Bereich ── */
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
            width: 65mm;
            margin-top: 15mm;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 1.2mm 0;
            font-size: 9pt;
        }

        .info-table td:first-child {
            color: #000;
            font-weight: bold;
        }

        /* ── Titel & Einleitung ── */
        .content-body {
            clear: both;
            padding-top: 2mm;
        }

        .title {
            font-size: 12pt;
            font-weight: 500;
            margin-bottom: 3mm;
        }

        .intro-text {
            margin-bottom: 5mm;
            font-size: 9pt;
            line-height: 1.5;
        }

        /* ── Positions-Tabelle ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }

        .items-table th {
            border-top: 1.5pt solid
                {{ $primaryColor }}
            ;
            border-bottom: 1.5pt solid
                {{ $primaryColor }}
            ;
            padding: 3mm 1.5mm;
            font-size: 8pt;
            font-weight: bold;
            color:
                {{ $primaryColor }}
            ;
            text-transform: uppercase;
            letter-spacing: 0.1mm;
        }

        .items-table td {
            padding: 3mm 1.5mm;
            border-bottom: 0.5pt solid #000;
            vertical-align: top;
            font-size: 9pt;
        }

        .items-table td.pos-nr {
            color: #000;
            text-align: center;
        }

        /* ── Summen-Bereich ── */
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
            border-top: 1.5pt solid
                {{ $primaryColor }}
            ;
            font-weight: bold;
            font-size: 10pt;
        }

        .total-due {
            border-top: 0.5pt solid #000;
        }

        .text-green {
            color: #000;
        }

        .text-red {
            color: #000;
        }

        /* ── Zahlungshinweis ── */
        .payment-terms {
            clear: both;
            margin-top: 10mm;
            padding-top: 4mm;
            border-top: 0.1mm solid #e2e8f0;
            font-size: 9pt;
        }

        .payment-terms p {
            margin: 0 0 2mm 0;
        }

        /* ── Footer ── */
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
            color: #000;
            display: block;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
            font-size: 7pt;
        }
    </style>
</head>

<body>

    @php
        $tId = $invoice->buyer->custom_fields['tenant_id'] ?? 1;
        $tenant = \App\Models\Tenant::find($tId);
        $settings = \App\Models\TenantSetting::where('tenant_id', $tId)->pluck('value', 'key');

        $companyName = $tenant->company_name ?? $tenant->name ?? $settings['company_name'] ?? 'Firma';
        $companyStreet = ($tenant->address_street ?? $settings['address_street'] ?? '') . ' ' . ($tenant->address_house_no ?? '');
        $companyZip = $tenant->address_zip ?? $settings['address_zip'] ?? '';
        $companyCity = $tenant->address_city ?? $settings['address_city'] ?? '';
        $companyCountry = $tenant->address_country ?? $settings['address_country'] ?? 'Deutschland';
        $fullAddressLine = trim($companyStreet) . ' · ' . $companyZip . ' ' . $companyCity . ' · ' . $companyCountry;

        $companyEmail = $tenant->email ?? $settings['email'] ?? $settings['company_email'] ?? '';
        $companyPhone = $tenant->phone ?? $settings['phone'] ?? '';
        $companyWebsite = $tenant->website ?? $settings['website'] ?? '';
        $companyBank = $tenant->bank_name ?? $settings['bank_name'] ?? '';
        $companyIBAN = $tenant->bank_iban ?? $settings['bank_iban'] ?? '';
        $companyBIC = $tenant->bank_bic ?? $settings['bank_bic'] ?? '';
        $companyBankCode = $tenant->bank_code ?? $settings['bank_code'] ?? '';
        $companyAccountHolder = $tenant->bank_account_holder ?? $settings['bank_account_holder'] ?? $companyName;
        $companyTaxNr = $tenant->tax_number ?? $settings['tax_number'] ?? '';
        $companyVatId = $tenant->vat_id ?? $settings['vat_id'] ?? '';

        // Layout settings
        $fontFamily = $settings['invoice_font_family'] ?? 'Inter, Helvetica, Arial, sans-serif';
        $fontSize = $settings['invoice_font_size'] ?? '9pt';
        $primaryColor = $settings['invoice_primary_color'] ?? '#000000';
        $logoPath = $settings['company_logo'] ?? ($tenant->settings['company_logo'] ?? null);
        $logoFullPath = $logoPath ? storage_path('app/public/' . $logoPath) : null;
        $logoBase64 = null;
        if ($logoFullPath && file_exists($logoFullPath)) {
            $logoBase64 = 'data:image/' . pathinfo($logoFullPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoFullPath));
        }

        $isCreditNote = ($invoice->buyer->custom_fields['invoice_type'] ?? 'invoice') === 'credit_note';
        $docTypeLabel = $isCreditNote ? 'Gutschrift' : 'Rechnung';

        // Paid amount & due amount
        $paidAmount = $invoice->buyer->custom_fields['paid_amount'] ?? 0;
        $grossAmount = $invoice->total_amount ?? 0;
        $dueAmount = max(0, $grossAmount - $paidAmount);
    @endphp

    {{-- DIN 5008 Falzmarken und Lochmarke --}}
    <div class="fold-mark-top"></div>
    <div class="punch-mark"></div>
    <div class="fold-mark-bottom"></div>

    {{-- Footer --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td style="width: 30%;">
                    <span class="footer-label">Anschrift</span>
                    {{ $companyName }}<br>
                    {{ trim($companyStreet) }}<br>
                    {{ $companyZip }} {{ $companyCity }}<br>
                    {{ $companyCountry }}
                </td>
                <td style="width: 33%; text-align: left;">
                    <span class="footer-label">Kontakt</span>
                    @if($companyEmail)
                        Email: {{ $companyEmail }}<br>
                    @endif
                    @if($companyPhone)
                        Telefon: {{ $companyPhone }}<br>
                    @endif
                    @if($companyWebsite)
                        Web: {{ $companyWebsite }}
                    @endif
                </td>
                <td style="width: 34%; text-align: left;">
                    <span class="footer-label">Bank & Steuer</span>
                    @if($companyBank)
                        {{ $companyBank }}@if($companyBIC) | BIC: {{ $companyBIC }}@endif<br>
                        @if($companyBankCode) BLZ: {{ $companyBankCode }}<br>@endif
                    @endif
                    @if($companyIBAN)
                        IBAN: {{ $companyIBAN }}<br>
                    @endif
                    @if($companyVatId)
                        USt-ID: {{ $companyVatId }}<br>
                    @endif
                    @if($companyTaxNr)
                        St.-Nr: {{ $companyTaxNr }}
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
            @if($logoBase64)
                <div style="text-align: right; margin-bottom: 4mm;">
                    <img src="{{ $logoBase64 }}" class="company-logo" alt="Logo">
                </div>
            @endif
            <table class="info-table">
                <tr>
                    <td>{{ $docTypeLabel }}-Nr.</td>
                    <td class="text-right">{{ $invoice->name }}</td>
                </tr>
                <tr>
                    <td>Datum</td>
                    <td class="text-right">
                        {{ $invoice->date ? $invoice->date->format('d.m.Y') : now()->format('d.m.Y') }}
                    </td>
                </tr>
                @if(isset($invoice->buyer->custom_fields['due_date']))
                    <tr>
                        <td>Fällig am</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['due_date'] }}</td>
                    </tr>
                @endif
                @if(isset($invoice->buyer->custom_fields['service_period']))
                    <tr>
                        <td>Leistungszeitraum</td>
                        <td class="text-right">{{ $invoice->buyer->custom_fields['service_period'] }}</td>
                    </tr>
                @endif
            </table>
        </div>
    </div>

    {{-- Rechnungsinhalt --}}
    <div class="content-body">
        <div class="title">{{ $docTypeLabel }} Nr. {{ $invoice->name }}</div>

        <div class="intro-text">
            Sehr geehrte Damen und Herren,<br><br>
            @if($isCreditNote)
                wir erstellen Ihnen hiermit folgende Gutschrift:
            @else
                wir stellen Ihnen hiermit folgende Leistungen in Rechnung:
            @endif
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%; text-align: center;">Pos</th>
                    <th style="width: 40%; text-align: left;">Bezeichnung</th>
                    <th style="width: 12%; text-align: right;">Menge</th>
                    <th style="width: 13%; text-align: right;">Einheit</th>
                    <th style="width: 15%; text-align: right;">Einzelpreis</th>
                    <th style="width: 15%; text-align: right;">Gesamtpreis</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $index => $item)
                    <tr>
                        <td class="pos-nr">{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->title }}</strong>
                            @if($item->description)
                                <br><span class="text-small"
                                    style="font-weight: normal;">{!! nl2br(e($item->description)) !!}</span>
                            @endif
                        </td>
                        <td class="text-right">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                        <td class="text-right">{{ $item->units ?? 'Stk' }}</td>
                        <td class="text-right">{{ number_format($item->price_per_unit, 2, ',', '.') }} €</td>
                        <td class="text-right">{{ number_format($item->sub_total_price, 2, ',', '.') }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-wrapper">
            <table class="totals-table">
                <tr>
                    <td>Nettobetrag:</td>
                    <td class="text-right">{{ number_format($invoice->taxable_amount, 2, ',', '.') }} €</td>
                </tr>
                @if($invoice->total_taxes > 0)
                    <tr>
                        <td>Umsatzsteuer {{ number_format($invoice->tax_rate ?? 19, 0) }}%:</td>
                        <td class="text-right">{{ number_format($invoice->total_taxes, 2, ',', '.') }} €</td>
                    </tr>
                @elseif(isset($invoice->buyer->custom_fields['invoice_type']) && $invoice->buyer->custom_fields['invoice_type'] !== 'credit_note')
                    <tr>
                        <td colspan="2" class="text-right text-small" style="font-style: italic;">
                            Kein USt-Ausweis gem. § 19 UStG
                        </td>
                    </tr>
                @endif
                @if(isset($invoice->total_shipping) && $invoice->total_shipping > 0)
                    <tr>
                        <td>Versandkosten:</td>
                        <td class="text-right">{{ number_format($invoice->total_shipping, 2, ',', '.') }} €</td>
                    </tr>
                @endif
                @if(isset($invoice->total_discount) && $invoice->total_discount > 0)
                    <tr>
                        <td>Rabatt:</td>
                        <td class="text-right">- {{ number_format($invoice->total_discount, 2, ',', '.') }} €</td>
                    </tr>
                @endif
                <tr class="total-brutto">
                    <td>Rechnungsbetrag:</td>
                    <td class="text-right">{{ number_format($invoice->total_amount, 2, ',', '.') }} €</td>
                </tr>
                @if($paidAmount > 0 && $dueAmount > 0)
                    <tr>
                        <td class="text-muted">Bereits bezahlt:</td>
                        <td class="text-right text-muted">- {{ number_format($paidAmount, 2, ',', '.') }} €</td>
                    </tr>
                    <tr class="total-due">
                        <td class="font-bold text-red">
                            Noch zu zahlen:
                        </td>
                        <td class="text-right font-bold text-red">
                            {{ number_format($dueAmount, 2, ',', '.') }} €
                        </td>
                    </tr>
                @endif
            </table>
        </div>

        <div class="payment-terms">
            @if($invoice->notes)
                <p>{!! nl2br(e($invoice->notes)) !!}</p>
            @endif

            @if($dueAmount > 0)
                <p>
                    Bitte überweisen Sie den Betrag von
                    <strong>{{ number_format($dueAmount, 2, ',', '.') }} €</strong>
                    @if(isset($invoice->buyer->custom_fields['due_date']))
                        bis zum <strong>{{ $invoice->buyer->custom_fields['due_date'] }}</strong>.
                    @else
                        innerhalb von 14 Tagen ab Rechnungseingang.
                    @endif
                    <br>Verwendungszweck: <strong>{{ $invoice->name }}</strong>
                </p>
            @endif

        </div>
    </div>

</body>

</html>