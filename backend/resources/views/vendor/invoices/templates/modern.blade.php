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
        $fontFamily = $settings['invoice_font_family'] ?? 'Inter, Helvetica, Arial, sans-serif';
        $fontSize = $settings['invoice_font_size'] ?? '9pt';
        $primaryColor = $settings['invoice_primary_color'] ?? '#1e293b';
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
            margin: 15mm 20mm 28mm 20mm;
        }

        body {
            font-family: {{ $fontFamily }};
            font-size: {{ $fontSize }};
            line-height: 1.5;
            color: #334155;
            margin: 0;
            padding: 0;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }

        /* ── Modern Header Bar ── */
        .header-bar {
            background: {{ $primaryColor }};
            color: #fff;
            padding: 8mm 10mm;
            margin: -15mm -20mm 8mm -20mm;
            width: calc(100% + 40mm);
            overflow: hidden;
        }

        .header-bar-inner {
            width: 100%;
        }

        .header-bar .company-name {
            font-size: 16pt;
            font-weight: 600;
            letter-spacing: 0.3mm;
        }

        .header-bar .company-contact {
            font-size: 7.5pt;
            opacity: 0.85;
            margin-top: 2mm;
        }

        .header-logo {
            float: right;
            max-height: 16mm;
            max-width: 45mm;
            object-fit: contain;
        }

        /* ── Address & Info ── */
        .address-info-row {
            width: 100%;
            margin-bottom: 8mm;
        }

        .recipient-block {
            float: left;
            width: 85mm;
        }

        .recipient-block .sender-line {
            font-size: 6.5pt;
            color: #94a3b8;
            text-decoration: underline;
            margin-bottom: 2mm;
        }

        .recipient-block .recipient {
            font-size: 10pt;
            line-height: 1.4;
            color: #1e293b;
        }

        .meta-block {
            float: right;
            width: 65mm;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-table td {
            padding: 1.5mm 0;
            font-size: 9pt;
        }

        .meta-table td:first-child {
            color: #64748b;
            font-weight: 500;
        }

        .meta-table td:last-child {
            text-align: right;
            font-weight: 600;
            color: #1e293b;
        }

        /* ── Title ── */
        .doc-title {
            font-size: 14pt;
            font-weight: 600;
            color: {{ $primaryColor }};
            margin-bottom: 3mm;
            clear: both;
        }

        .intro-text {
            font-size: 9pt;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 6mm;
        }

        /* ── Items Table ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
        }

        .items-table th {
            background: {{ $primaryColor }};
            color: #fff;
            padding: 3mm 2mm;
            font-size: 7.5pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2mm;
        }

        .items-table th:first-child {
            border-radius: 1mm 0 0 0;
        }

        .items-table th:last-child {
            border-radius: 0 1mm 0 0;
        }

        .items-table td {
            padding: 3mm 2mm;
            border-bottom: 0.3pt solid #e2e8f0;
            vertical-align: top;
            font-size: 9pt;
            color: #334155;
        }

        .items-table tr:nth-child(even) td {
            background: #f8fafc;
        }

        .items-table td.pos-nr {
            text-align: center;
            color: #94a3b8;
            font-weight: 500;
        }

        /* ── Totals ── */
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
            padding: 1.5mm 2mm;
            font-size: 9pt;
            color: #475569;
        }

        .total-brutto {
            border-top: 2pt solid {{ $primaryColor }};
            font-weight: 700;
            font-size: 11pt;
        }

        .total-brutto td {
            color: {{ $primaryColor }} !important;
            padding-top: 2.5mm;
        }

        .total-due td {
            border-top: 0.5pt solid #cbd5e1;
        }

        /* ── Payment ── */
        .payment-terms {
            clear: both;
            margin-top: 10mm;
            padding: 4mm 5mm;
            background: #f8fafc;
            border-left: 3pt solid {{ $primaryColor }};
            font-size: 9pt;
            color: #475569;
        }

        .payment-terms p {
            margin: 0 0 2mm 0;
        }

        /* ── Footer ── */
        .footer {
            position: fixed;
            bottom: -18mm;
            left: 0;
            right: 0;
            width: 100%;
            border-top: 1.5pt solid {{ $primaryColor }};
            padding-top: 3mm;
            font-size: 7pt;
            line-height: 1.4;
            color: #64748b;
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
            font-weight: 700;
            color: {{ $primaryColor }};
            display: block;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
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
                        {{ $companyEmail }}<br>
                    @endif
                    @if($companyPhone)
                        Tel: {{ $companyPhone }}<br>
                    @endif
                    @if($companyWebsite)
                        {{ $companyWebsite }}
                    @endif
                </td>
                <td style="width: 34%; text-align: left;">
                    <span class="footer-label">Bank & Steuer</span>
                    @if($companyIBAN)
                        IBAN: {{ $companyIBAN }}<br>
                    @endif
                    @if($companyBank)
                        {{ $companyBank }}@if($companyBIC) | {{ $companyBIC }}@endif<br>
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

    {{-- Header Bar --}}
    <div class="header-bar">
        <div class="header-bar-inner">
            @if($logoBase64)
                <img src="{{ $logoBase64 }}" class="header-logo" alt="Logo">
            @endif
            <div class="company-name">{{ $companyName }}</div>
            <div class="company-contact">
                @if($companyPhone)Tel: {{ $companyPhone }}@endif
                @if($companyPhone && $companyEmail) · @endif
                @if($companyEmail){{ $companyEmail }}@endif
                @if(($companyPhone || $companyEmail) && $companyWebsite) · @endif
                @if($companyWebsite){{ $companyWebsite }}@endif
            </div>
        </div>
    </div>

    {{-- Address & Meta --}}
    <div class="address-info-row">
        <div class="recipient-block">
            <div class="sender-line">{{ $companyName }} · {{ trim($companyStreet) }} · {{ $companyZip }} {{ $companyCity }}</div>
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
        <div class="meta-block">
            <table class="meta-table">
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
    <div style="clear: both; padding-top: 2mm;">
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
                                <br><span style="font-size: 7.5pt; color: #94a3b8;">{{ $item->description }}</span>
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
                        <td colspan="2" class="text-right" style="font-size: 7.5pt; font-style: italic; color: #94a3b8;">
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
