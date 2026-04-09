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
        $primary = $layout['primary_color'] ?? '#2b2b2b';
    @endphp
    <title>{{ $document['type_label'] ?? 'Rechnung' }} {{ $document['number'] ?? $invoice->name }}</title>
    <style>
        @page { margin: 22mm 24mm 26mm 24mm; }
        body { font-family: {{ $layout['font_family'] ?? 'Georgia, Times New Roman, serif' }}; font-size: {{ $layout['font_size'] ?? '10pt' }}; color: #222; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        .text-right { text-align: right; }
        .center { text-align: center; }
        .muted { color: #666; }
        .header { text-align: center; margin-bottom: 9mm; padding-bottom: 5mm; border-bottom: 3px double {{ $primary }}; }
        .logo { max-width: 48mm; max-height: 18mm; margin-bottom: 3mm; }
        .brand { font-size: 18pt; font-weight: 700; letter-spacing: 0.08em; color: {{ $primary }}; }
        .tagline { margin-top: 2mm; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; }
        .recipient-area { margin-bottom: 8mm; }
        .recipient-col { width: 55%; vertical-align: top; }
        .meta-col { width: 45%; vertical-align: top; }
        .senderline { font-size: 6.8pt; text-decoration: underline; color: #777; margin-bottom: 2mm; }
        .meta-card { margin-left: 8mm; border: 1px solid #d1d5db; padding: 4mm; }
        .meta-card td { padding: 1.4mm 0; }
        .title { margin: 5mm 0 3mm; font-size: 15pt; font-weight: 700; color: {{ $primary }}; }
        .lead { margin-bottom: 6mm; line-height: 1.65; }
        .items th { padding: 2.8mm 2mm; border-top: 1px solid {{ $primary }}; border-bottom: 1px solid {{ $primary }}; text-transform: uppercase; letter-spacing: 0.08em; font-size: 7.6pt; color: {{ $primary }}; }
        .items td { padding: 3mm 2mm; border-bottom: 1px solid #ddd; vertical-align: top; }
        .desc strong { display: block; }
        .desc span { display: block; margin-top: 1mm; font-size: 8pt; color: #666; line-height: 1.5; }
        .totals { width: 86mm; margin-top: 6mm; margin-left: auto; }
        .totals td { padding: 1.6mm 1.5mm; }
        .grand td { border-top: 2px solid {{ $primary }}; padding-top: 3mm; font-weight: 700; color: {{ $primary }}; }
        .due td { border-top: 1px solid #cfcfcf; font-weight: 700; }
        .notice { margin-top: 9mm; padding-top: 4mm; border-top: 1px solid #d1d5db; line-height: 1.7; }
        .footer { position: fixed; left: 0; right: 0; bottom: -15mm; border-top: 1px solid #d1d5db; padding-top: 3mm; font-size: 7.5pt; color: #555; }
        .footer td { width: 33.33%; vertical-align: top; padding-right: 4mm; }
        .footer strong { display: block; margin-bottom: 1mm; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #222; }
    </style>
</head>

<body>
    <div class="header">
        @if(!empty($company['logo_base64']) && extension_loaded('gd'))
            <img src="{{ $company['logo_base64'] }}" alt="Logo" class="logo">
        @endif
        <div class="brand">{{ $company['name'] ?? 'Firma' }}</div>
        <div class="tagline">Professionelle Sprachdienstleistungen und kaufmaennische Dokumentation</div>
    </div>

    <table class="recipient-area">
        <tr>
            <td class="recipient-col">
                <div class="senderline">{{ $company['name'] ?? '' }} · {{ $company['full_address_line'] ?? '' }}</div>
                <strong>{{ $recipient['name'] ?? $invoice->buyer->name }}</strong><br>
                @foreach(($recipient['address_lines'] ?? []) as $line)
                    {{ $line }}<br>
                @endforeach
            </td>
            <td class="meta-col">
                <div class="meta-card">
                    <table>
                        <tr><td class="muted">{{ $document['type_label'] ?? 'Rechnung' }}-Nr.</td><td class="text-right"><strong>{{ $document['number'] ?? $invoice->name }}</strong></td></tr>
                        <tr><td class="muted">Rechnungsdatum</td><td class="text-right">{{ $document['date'] ?? '' }}</td></tr>
                        @if(!empty($document['due_date']))<tr><td class="muted">Zahlbar bis</td><td class="text-right">{{ $document['due_date'] }}</td></tr>@endif
                        @if(!empty($document['service_period']))<tr><td class="muted">Leistungszeitraum</td><td class="text-right">{{ $document['service_period'] }}</td></tr>@endif
                        @if(!empty($document['project_number']))<tr><td class="muted">Vorgang</td><td class="text-right">{{ $document['project_number'] }}</td></tr>@endif
                    </table>
                </div>
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
                <th style="width:7%;">Pos.</th>
                <th style="width:41%; text-align:left;">Leistung</th>
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
        <tr><td class="muted">Netto</td><td class="text-right">{{ number_format($invoice->taxable_amount, 2, ',', '.') }} EUR</td></tr>
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
            <tr class="due"><td>Restbetrag</td><td class="text-right">{{ number_format($amounts['due'], 2, ',', '.') }} EUR</td></tr>
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
                    @if(!empty($company['legal_form']))Rechtsform: {{ $company['legal_form'] }}@endif
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
