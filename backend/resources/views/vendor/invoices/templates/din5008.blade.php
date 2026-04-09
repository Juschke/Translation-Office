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
        $primary = $layout['primary_color'] ?? '#111827';
    @endphp
    <title>{{ $document['type_label'] ?? 'Rechnung' }} {{ $document['number'] ?? $invoice->name }}</title>
    <style>
        @page { margin: 20mm 20mm 28mm 25mm; }
        body { font-family: {{ $layout['font_family'] ?? 'Helvetica, Arial, sans-serif' }}; font-size: {{ $layout['font_size'] ?? '9pt' }}; color: #111; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        .text-right { text-align: right; }
        .muted { color: #4b5563; }
        .fold, .punch { position: fixed; left: -20mm; width: 4mm; border-top: 0.5pt solid #808080; }
        .fold.top { top: 87mm; }
        .punch { top: 148.5mm; }
        .fold.bottom { top: 192mm; }
        .header { margin-bottom: 10mm; }
        .address-col { width: 58%; vertical-align: top; }
        .info-col { width: 42%; vertical-align: top; }
        .senderline { margin-top: 14mm; margin-bottom: 2mm; font-size: 6.5pt; text-decoration: underline; color: #666; }
        .address-box { width: 85mm; line-height: 1.35; }
        .logo-wrap { text-align: right; margin-top: 6mm; margin-bottom: 5mm; }
        .logo { max-width: 46mm; max-height: 18mm; object-fit: contain; }
        .info-table td { padding: 1.2mm 0; vertical-align: top; }
        .info-table td:first-child { width: 45%; color: #374151; }
        .title { margin: 4mm 0 3mm; font-size: 14pt; font-weight: 700; color: {{ $primary }}; }
        .lead { margin-bottom: 6mm; line-height: 1.6; }
        .items th { padding: 2.6mm 1.8mm; border-top: 1.3pt solid {{ $primary }}; border-bottom: 1.3pt solid {{ $primary }}; text-transform: uppercase; letter-spacing: 0.07em; font-size: 7.7pt; color: {{ $primary }}; }
        .items td { padding: 2.7mm 1.8mm; border-bottom: 0.6pt solid #d1d5db; vertical-align: top; }
        .items .desc strong { display: block; }
        .items .desc span { display: block; margin-top: 1mm; font-size: 8pt; line-height: 1.45; color: #4b5563; }
        .totals { width: 82mm; margin-left: auto; margin-top: 6mm; }
        .totals td { padding: 1.6mm 1mm; }
        .grand td { border-top: 1.4pt solid {{ $primary }}; padding-top: 2.7mm; font-weight: 700; color: {{ $primary }}; }
        .due td { border-top: 0.8pt solid #9ca3af; font-weight: 700; }
        .notice { clear: both; margin-top: 10mm; padding-top: 4mm; border-top: 0.8pt solid #cbd5e1; line-height: 1.65; }
        .footer { position: fixed; left: 0; right: 0; bottom: -16mm; border-top: 1pt solid #9ca3af; padding-top: 3mm; font-size: 7.3pt; color: #374151; }
        .footer td { width: 33.33%; vertical-align: top; padding-right: 4mm; }
        .footer strong { display: block; margin-bottom: 1mm; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.07em; color: #111; }
    </style>
</head>

<body>
    <div class="fold top"></div>
    <div class="punch"></div>
    <div class="fold bottom"></div>

    <table class="header">
        <tr>
            <td class="address-col">
                <div class="senderline">{{ $company['name'] ?? '' }} · {{ $company['full_address_line'] ?? '' }}</div>
                <div class="address-box">
                    <strong>{{ $recipient['name'] ?? $invoice->buyer->name }}</strong><br>
                    @foreach(($recipient['address_lines'] ?? []) as $line)
                        {{ $line }}<br>
                    @endforeach
                </div>
            </td>
            <td class="info-col">
                @if(!empty($company['logo_base64']) && extension_loaded('gd'))
                    <div class="logo-wrap"><img src="{{ $company['logo_base64'] }}" alt="Logo" class="logo"></div>
                @endif
                <table class="info-table">
                    <tr><td>{{ $document['type_label'] ?? 'Rechnung' }}-Nr.</td><td class="text-right"><strong>{{ $document['number'] ?? $invoice->name }}</strong></td></tr>
                    <tr><td>Datum</td><td class="text-right">{{ $document['date'] ?? '' }}</td></tr>
                    @if(!empty($document['due_date']))<tr><td>Faellig am</td><td class="text-right">{{ $document['due_date'] }}</td></tr>@endif
                    @if(!empty($document['delivery_date']))<tr><td>Leistungsdatum</td><td class="text-right">{{ $document['delivery_date'] }}</td></tr>@endif
                    @if(!empty($document['service_period']))<tr><td>Leistungszeitraum</td><td class="text-right">{{ $document['service_period'] }}</td></tr>@endif
                    @if(!empty($document['buyer_reference']))<tr><td>Ihr Zeichen</td><td class="text-right">{{ $document['buyer_reference'] }}</td></tr>@endif
                    @if(!empty($document['leitweg_id']))<tr><td>Leitweg-ID</td><td class="text-right">{{ $document['leitweg_id'] }}</td></tr>@endif
                </table>
            </td>
        </tr>
    </table>

    <div class="title">{{ $document['type_label'] ?? 'Rechnung' }} {{ $document['number'] ?? $invoice->name }}</div>
    <div class="lead">
        Sehr geehrte Damen und Herren,<br><br>
        {!! nl2br(e($document['intro_text'] ?? 'wir berechnen Ihnen die nachfolgend aufgefuehrten Leistungen wie vereinbart.')) !!}
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width:6%;">Pos.</th>
                <th style="width:43%; text-align:left;">Leistungsbeschreibung</th>
                <th style="width:11%;" class="text-right">Menge</th>
                <th style="width:10%;" class="text-right">Einheit</th>
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
            <tr><td colspan="2" class="text-right muted" style="font-size: 7.8pt;">Umsatzsteuer wird entsprechend der hinterlegten steuerlichen Behandlung nicht gesondert ausgewiesen.</td></tr>
        @endif
        @if(($amounts['shipping'] ?? 0) > 0)<tr><td class="muted">Versand</td><td class="text-right">{{ number_format($amounts['shipping'], 2, ',', '.') }} EUR</td></tr>@endif
        @if(($amounts['discount'] ?? 0) > 0)<tr><td class="muted">Nachlass</td><td class="text-right">- {{ number_format($amounts['discount'], 2, ',', '.') }} EUR</td></tr>@endif
        <tr class="grand"><td>Gesamtbetrag</td><td class="text-right">{{ number_format($invoice->total_amount, 2, ',', '.') }} EUR</td></tr>
        @if(($amounts['paid'] ?? 0) > 0 && ($amounts['due'] ?? 0) > 0)
            <tr><td class="muted">Bereits bezahlt</td><td class="text-right">- {{ number_format($amounts['paid'], 2, ',', '.') }} EUR</td></tr>
            <tr class="due"><td>Zu zahlen</td><td class="text-right">{{ number_format($amounts['due'], 2, ',', '.') }} EUR</td></tr>
        @endif
    </table>

    <div class="notice">
        {!! nl2br(e(trim(($document['closing_text'] ?? '') . "\n" . ($document['notes'] ?? '')))) !!}
        @if(($amounts['due'] ?? 0) > 0)
            <br><br>Verwendungszweck: <strong>{{ $document['payment_reference'] ?? ($document['number'] ?? $invoice->name) }}</strong>
        @endif
    </div>

    <div class="footer">
        <table>
            <tr>
                <td>
                    <strong>Anschrift</strong>
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
