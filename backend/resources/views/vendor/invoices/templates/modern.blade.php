<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    @php
        $meta = $invoice->getCustomData() ?? [];
        $company = $meta['company'] ?? [];
        $layout = $meta['layout'] ?? [];
        $document = $meta['document'] ?? [];
        $amounts = $meta['amounts'] ?? [];
        $recipient = $meta['recipient'] ?? [];
        $primary = $layout['primary_color'] ?? '#16324f';
    @endphp
    <title>{{ $document['type_label'] ?? 'Rechnung' }} {{ $document['number'] ?? $invoice->name }}</title>
    <style>
        @page { margin: 18mm 18mm 24mm 18mm; }
        body { font-family: {{ $layout['font_family'] ?? 'Helvetica, Arial, sans-serif' }}; font-size: {{ $layout['font_size'] ?? '9pt' }}; color: #1f2937; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        .text-right { text-align: right; }
        .muted { color: #64748b; }
        .topband { margin: -18mm -18mm 10mm; padding: 10mm 18mm 8mm; background: {{ $primary }}; color: #fff; }
        .brand { font-size: 17pt; font-weight: 700; letter-spacing: 0.04em; }
        .brand-sub { margin-top: 2mm; font-size: 8pt; opacity: 0.92; }
        .logo { float: right; max-width: 42mm; max-height: 16mm; object-fit: contain; }
        .meta { margin-bottom: 7mm; }
        .recipient { width: 58%; vertical-align: top; }
        .recipient-box { padding: 5mm; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3mm; }
        .meta-box { width: 38%; vertical-align: top; }
        .meta-card { margin-left: 6mm; padding: 4mm; border: 1px solid #dbe3ec; border-radius: 3mm; }
        .meta-card td { padding: 1.4mm 0; vertical-align: top; }
        .doc-title { margin: 4mm 0 2mm; font-size: 16pt; font-weight: 700; color: {{ $primary }}; }
        .lead { margin: 0 0 6mm; line-height: 1.65; }
        .items th { padding: 3mm 2mm; font-size: 7.8pt; text-transform: uppercase; letter-spacing: 0.08em; background: {{ $primary }}; color: #fff; }
        .items td { padding: 3mm 2mm; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .items tbody tr:nth-child(even) td { background: #f8fafc; }
        .desc strong { display: block; color: #0f172a; }
        .desc span { display: block; margin-top: 1mm; font-size: 8pt; color: #64748b; line-height: 1.45; }
        .totals { width: 88mm; margin-left: auto; margin-top: 6mm; }
        .totals td { padding: 1.7mm 2mm; }
        .grand td { padding-top: 3mm; border-top: 2px solid {{ $primary }}; font-weight: 700; color: {{ $primary }}; }
        .due td { border-top: 1px solid #cbd5e1; font-weight: 700; color: #0f172a; }
        .notice { margin-top: 9mm; padding: 4.5mm 5mm; background: #f8fafc; border-left: 3px solid {{ $primary }}; line-height: 1.6; }
        .footer { position: fixed; left: 0; right: 0; bottom: -14mm; border-top: 1px solid #cbd5e1; padding-top: 3mm; font-size: 7.4pt; color: #475569; }
        .footer td { width: 33.33%; vertical-align: top; padding-right: 4mm; }
        .footer strong { display: block; margin-bottom: 1mm; color: #0f172a; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.06em; }
    </style>
</head>

<body>
    <div class="topband">
        @if(!empty($company['logo_base64']) && extension_loaded('gd'))
            <img src="{{ $company['logo_base64'] }}" alt="Logo" class="logo">
        @endif
        <div class="brand">{{ $company['name'] ?? 'Firma' }}</div>
        <div class="brand-sub">
            @if(!empty($company['phone'])){{ $company['phone'] }}@endif
            @if(!empty($company['phone']) && !empty($company['email'])) | @endif
            @if(!empty($company['email'])){{ $company['email'] }}@endif
            @if((!empty($company['phone']) || !empty($company['email'])) && !empty($company['website'])) | @endif
            @if(!empty($company['website'])){{ $company['website'] }}@endif
        </div>
    </div>

    <table class="meta">
        <tr>
            <td class="recipient">
                <div class="recipient-box">
                    <div class="muted" style="font-size: 7pt; margin-bottom: 2mm;">{{ $company['name'] ?? '' }} · {{ $company['full_address_line'] ?? '' }}</div>
                    <strong>{{ !empty($recipient['salutation']) ? $recipient['salutation'] . ' ' : '' }}{{ $recipient['name'] ?? $invoice->buyer->name }}</strong><br>
                    @foreach(($recipient['address_lines'] ?? []) as $line)
                        {{ $line }}<br>
                    @endforeach
                </div>
            </td>
            <td class="meta-box">
                <div class="meta-card">
                    <table>
                        <tr><td class="muted">{{ $document['type_label'] ?? 'Rechnung' }}-Nr.</td><td class="text-right"><strong>{{ $document['number'] ?? $invoice->name }}</strong></td></tr>
                        <tr><td class="muted">Datum</td><td class="text-right">{{ $document['date'] ?? '' }}</td></tr>
                        @if(!empty($document['due_date']))<tr><td class="muted">Faelligkeit</td><td class="text-right">{{ $document['due_date'] }}</td></tr>@endif
                        @if(!empty($document['service_period']))<tr><td class="muted">Leistungszeitraum</td><td class="text-right">{{ $document['service_period'] }}</td></tr>@endif
                        @if(!empty($document['customer_number']))<tr><td class="muted">Kundennummer</td><td class="text-right">{{ $document['customer_number'] }}</td></tr>@endif
                        @if(!empty($document['order_reference']))<tr><td class="muted">Bestellbezug</td><td class="text-right">{{ $document['order_reference'] }}</td></tr>@endif
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <div class="doc-title">{{ $document['type_label'] ?? 'Rechnung' }} {{ $document['number'] ?? $invoice->name }}</div>
    <div class="lead">
        Sehr geehrte Damen und Herren,<br><br>
        {!! nl2br(e($document['intro_text'] ?? 'wir berechnen Ihnen die nachfolgend aufgefuehrten Leistungen wie vereinbart.')) !!}
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width:6%;">Pos.</th>
                <th style="width:42%; text-align:left;">Leistungsbeschreibung</th>
                <th style="width:11%;" class="text-right">Menge</th>
                <th style="width:11%;" class="text-right">Einheit</th>
                <th style="width:15%;" class="text-right">Einzelpreis</th>
                <th style="width:15%;" class="text-right">Betrag</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $index => $item)
                <tr>
                    <td class="text-right">{{ $index + 1 }}</td>
                    <td class="desc">
                        <strong>{{ $item->title }}</strong>
                        @if($item->description)
                            <span>{{ $item->description }}</span>
                        @endif
                    </td>
                    <td class="text-right">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                    <td class="text-right">{{ $item->units ?? 'Stk.' }}</td>
                    <td class="text-right">{{ number_format($item->price_per_unit, 2, ',', '.') }} EUR</td>
                    <td class="text-right">{{ number_format($item->sub_total_price, 2, ',', '.') }} EUR</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="muted">Nettobetrag</td><td class="text-right">{{ number_format($invoice->taxable_amount, 2, ',', '.') }} EUR</td></tr>
        @if(($amounts['tax'] ?? 0) > 0)
            <tr><td class="muted">Umsatzsteuer {{ number_format($document['tax_rate'] ?? 19, 0, ',', '.') }}%</td><td class="text-right">{{ number_format($invoice->total_taxes, 2, ',', '.') }} EUR</td></tr>
        @elseif(!empty($document['is_tax_exempt']))
            <tr><td colspan="2" class="text-right muted" style="font-size: 7.8pt;">Steuerbefreite oder nicht steuerbare Leistung gem&auml;&szlig; hinterlegtem Steuerschl&uuml;ssel.</td></tr>
        @endif
        @if(($amounts['shipping'] ?? 0) > 0)
            <tr><td class="muted">Versand</td><td class="text-right">{{ number_format($amounts['shipping'], 2, ',', '.') }} EUR</td></tr>
        @endif
        @if(($amounts['discount'] ?? 0) > 0)
            <tr><td class="muted">Nachlass</td><td class="text-right">- {{ number_format($amounts['discount'], 2, ',', '.') }} EUR</td></tr>
        @endif
        <tr class="grand"><td>Gesamtbetrag</td><td class="text-right">{{ number_format($invoice->total_amount, 2, ',', '.') }} EUR</td></tr>
        @if(($amounts['paid'] ?? 0) > 0 && ($amounts['due'] ?? 0) > 0)
            <tr><td class="muted">Bereits bezahlt</td><td class="text-right">- {{ number_format($amounts['paid'], 2, ',', '.') }} EUR</td></tr>
            <tr class="due"><td>Offener Betrag</td><td class="text-right">{{ number_format($amounts['due'], 2, ',', '.') }} EUR</td></tr>
        @endif
    </table>

    <div class="notice">
        {!! nl2br(e(trim(($document['closing_text'] ?? '') . "\n" . ($document['notes'] ?? '')))) !!}
        @if(($amounts['due'] ?? 0) > 0)
            <br><br>
            Verwendungszweck: <strong>{{ $document['payment_reference'] ?? ($document['number'] ?? $invoice->name) }}</strong>
        @endif
    </div>

    <div class="footer">
        <table>
            <tr>
                <td>
                    <strong>Unternehmen</strong>
                    {{ $company['name'] ?? '' }}<br>
                    {{ $company['street'] ?? '' }}<br>
                    {{ trim(($company['zip'] ?? '') . ' ' . ($company['city'] ?? '')) }}<br>
                    {{ $company['country'] ?? '' }}
                </td>
                <td>
                    <strong>Kontakt</strong>
                    @if(!empty($company['email']))E-Mail: {{ $company['email'] }}<br>@endif
                    @if(!empty($company['phone']))Telefon: {{ $company['phone'] }}<br>@endif
                    @if(!empty($company['website']))Web: {{ $company['website'] }}<br>@endif
                    @if(!empty($company['managing_director']))Geschaeftsfuehrung: {{ $company['managing_director'] }}@endif
                </td>
                <td>
                    <strong>Bank und Steuern</strong>
                    @if(!empty($company['bank_name'])){{ $company['bank_name'] }}<br>@endif
                    @if(!empty($company['iban']))IBAN: {{ $company['iban'] }}<br>@endif
                    @if(!empty($company['bic']))BIC: {{ $company['bic'] }}<br>@endif
                    @if(!empty($company['vat_id']))USt-IdNr.: {{ $company['vat_id'] }}<br>@endif
                    @if(!empty($company['tax_number']))Steuernummer: {{ $company['tax_number'] }}@endif
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
