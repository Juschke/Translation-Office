<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Rechnung {{ $invoice->name }}</title>

    @php
        $tId = $invoice->buyer->custom_fields['tenant_id'] ?? 1;
        $tenant = \App\Models\Tenant::find($tId);
        $settings = \App\Models\TenantSetting::where('tenant_id', $tId)->pluck('value', 'key');

        $companyName = $tenant->company_name ?? $tenant->name ?? $settings['company_name'] ?? 'Firma';
        $companyStreet = ($tenant->address_street ?? $settings['address_street'] ?? '') . ' ' . ($tenant->address_house_no ?? '');
        $companyZip = $tenant->address_zip ?? $settings['address_zip'] ?? '';
        $companyCity = $tenant->address_city ?? $settings['address_city'] ?? '';
        $companyCountry = $tenant->address_country ?? $settings['address_country'] ?? 'Deutschland';

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
        $fontFamily = $settings['invoice_font_family'] ?? 'Georgia, Times New Roman, serif';
        $fontSize = $settings['invoice_font_size'] ?? '10pt';
        $primaryColor = $settings['invoice_primary_color'] ?? '#1a1a1a';
        $logoPath = $settings['company_logo'] ?? ($tenant->settings['company_logo'] ?? null);
        $logoFullPath = $logoPath ? storage_path('app/public/' . $logoPath) : null;
        $logoBase64 = null;
        if ($logoFullPath && file_exists($logoFullPath)) {
            $logoBase64 = 'data:image/' . pathinfo($logoFullPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($logoFullPath));
        }

        $isCreditNote = ($invoice->buyer->custom_fields['invoice_type'] ?? 'invoice') === 'credit_note';
        $docTypeLabel = $isCreditNote ? 'Gutschrift' : 'Rechnung';

        $paidAmount = $invoice->buyer->custom_fields['paid_amount'] ?? 0;
        $grossAmount = $invoice->total_amount ?? 0;
        $dueAmount = max(0, $grossAmount - $paidAmount);
    @endphp

    <style>
        @page {
            margin: 20mm 25mm 30mm 25mm;
        }

        body {
            font-family:
                {{ $fontFamily }}
            ;
            font-size:
                {{ $fontSize }}
            ;
            line-height: 1.6;
            color: #1a1a1a;
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

        /* ── Classic Centered Header ── */
        .classic-header {
            text-align: center;
            padding-bottom: 6mm;
            border-bottom: 2pt double
                {{ $primaryColor }}
            ;
            margin-bottom: 8mm;
        }

        .classic-header .company-logo {
            max-height: 20mm;
            max-width: 55mm;
            object-fit: contain;
            margin-bottom: 3mm;
        }

        .classic-header .company-name {
            font-size: 18pt;
            font-weight: bold;
            color:
                {{ $primaryColor }}
            ;
            letter-spacing: 0.5mm;
            margin: 0;
        }

        .classic-header .company-subtitle {
            font-size: 8pt;
            color: #666;
            margin-top: 1.5mm;
            letter-spacing: 0.3mm;
        }

        /* ── Address Row ── */
        .address-row {
            width: 100%;
            margin-bottom: 8mm;
            margin-top: 5mm;
        }

        .address-left {
            float: left;
            width: 85mm;
        }

        .address-left .sender-line {
            font-size: 6.5pt;
            color: #888;
            text-decoration: underline;
            margin-bottom: 2mm;
        }

        .address-left .recipient {
            font-size: 10pt;
            line-height: 1.4;
        }

        .address-right {
            float: right;
            width: 60mm;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 1.5mm 0;
            font-size: 9pt;
            border-bottom: 0.3pt dotted #ccc;
        }

        .info-table td:first-child {
            color: #666;
        }

        .info-table td:last-child {
            text-align: right;
            font-weight: bold;
        }

        /* ── Content ── */
        .content-body {
            clear: both;
            padding-top: 4mm;
        }

        .doc-title {
            font-size: 13pt;
            font-weight: bold;
            color:
                {{ $primaryColor }}
            ;
            margin-bottom: 4mm;
            border-bottom: 1pt solid
                {{ $primaryColor }}
            ;
            padding-bottom: 2mm;
        }

        .intro-text {
            font-size: 9.5pt;
            line-height: 1.6;
            margin-bottom: 6mm;
            color: #333;
        }

        /* ── Items Table ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }

        .items-table th {
            border-top: 1pt solid
                {{ $primaryColor }}
            ;
            border-bottom: 1pt solid
                {{ $primaryColor }}
            ;
            padding: 2.5mm 2mm;
            font-size: 8pt;
            font-weight: bold;
            color:
                {{ $primaryColor }}
            ;
            text-transform: uppercase;
            letter-spacing: 0.15mm;
        }

        .items-table td {
            padding: 3mm 2mm;
            border-bottom: 0.3pt solid #ddd;
            vertical-align: top;
        }

        .items-table td.pos-nr {
            text-align: center;
            color: #999;
        }

        .items-table .item-desc-sub {
            font-size: 7.5pt;
            color: #888;
            font-style: italic;
        }

        /* ── Totals ── */
        .totals-wrapper {
            float: right;
            width: 80mm;
            margin-top: 5mm;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 1.5mm 2mm;
            font-size: 9.5pt;
        }

        .total-brutto {
            border-top: 2pt solid
                {{ $primaryColor }}
            ;
            font-weight: bold;
            font-size: 11pt;
        }

        .total-brutto td {
            color:
                {{ $primaryColor }}
            ;
            padding-top: 2.5mm;
        }

        .total-due td {
            border-top: 0.5pt solid #ccc;
        }

        /* ── Payment ── */
        .payment-terms {
            clear: both;
            margin-top: 10mm;
            padding-top: 4mm;
            border-top: 0.5pt solid #ddd;
            font-size: 9pt;
            color: #444;
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
            border-top: 2pt double
                {{ $primaryColor }}
            ;
            padding-top: 3mm;
            font-size: 7pt;
            line-height: 1.4;
            color: #666;
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
            color:
                {{ $primaryColor }}
            ;
            display: block;
            margin-bottom: 1.5mm;
            font-size: 6.5pt;
            letter-spacing: 0.2mm;
        }
    </style>
</head>

<body>

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

    {{-- Classic Centered Header --}}
    <div class="classic-header">
        @if($logoBase64)
            <img src="{{ $logoBase64 }}" class="company-logo" alt="Logo"><br>
        @endif
        <div class="company-name">{{ $companyName }}</div>
        <div class="company-subtitle">
            {{ trim($companyStreet) }} · {{ $companyZip }} {{ $companyCity }} · {{ $companyCountry }}
            @if($companyPhone) · Tel: {{ $companyPhone }}@endif
        </div>
    </div>

    {{-- Address & Info --}}
    <div class="address-row">
        <div class="address-left">
            <div class="sender-line">{{ $companyName }} · {{ trim($companyStreet) }} · {{ $companyZip }}
                {{ $companyCity }}
            </div>
            <div class="recipient">
                <strong>{{ $invoice->buyer->name }}</strong><br>
                @if(isset($invoice->buyer->custom_fields['address']))
                    {!! nl2br(e($invoice->buyer->custom_fields['address'])) !!}
                @else
                    {{ $invoice->buyer->custom_fields['street'] ?? '' }}<br>
                    {{ $invoice->buyer->custom_fields['zip'] ?? '' }}
                    {{ $invoice->buyer->custom_fields['city'] ?? '' }}<br>
                    {{ $invoice->buyer->custom_fields['country'] ?? 'Deutschland' }}
                @endif
            </div>
        </div>
        <div class="address-right">
            <table class="info-table">
                <tr>
                    <td>{{ $docTypeLabel }}-Nr.</td>
                    <td>{{ $invoice->name }}</td>
                </tr>
                <tr>
                    <td>Datum</td>
                    <td>{{ $invoice->date ? $invoice->date->format('d.m.Y') : now()->format('d.m.Y') }}</td>
                </tr>
                @if(isset($invoice->buyer->custom_fields['due_date']))
                    <tr>
                        <td>Fällig am</td>
                        <td>{{ $invoice->buyer->custom_fields['due_date'] }}</td>
                    </tr>
                @endif
                @if(isset($invoice->buyer->custom_fields['service_period']))
                    <tr>
                        <td>Leistungszeitraum</td>
                        <td>{{ $invoice->buyer->custom_fields['service_period'] }}</td>
                    </tr>
                @endif
            </table>
        </div>
    </div>

    {{-- Content --}}
    <div class="content-body">
        <div class="doc-title">{{ $docTypeLabel }} Nr. {{ $invoice->name }}</div>

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
                                <br><span class="item-desc-sub">{!! nl2br(e($item->description)) !!}</span>
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
                        <td colspan="2" class="text-right" style="font-size: 7.5pt; font-style: italic; color: #888;">
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
                        <td>Bereits bezahlt:</td>
                        <td class="text-right">- {{ number_format($paidAmount, 2, ',', '.') }} €</td>
                    </tr>
                    <tr class="total-due">
                        <td class="font-bold">
                            Noch zu zahlen:
                        </td>
                        <td class="text-right font-bold">
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