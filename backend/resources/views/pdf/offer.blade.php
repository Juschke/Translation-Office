<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Angebot {{ $project->project_number ?? $project->id }}</title>
    <style>
        @page { margin: 20mm 20mm 24mm 20mm; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #16202a; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        .text-right { text-align: right; }
        .muted { color: #5b6572; }
        .header { margin-bottom: 8mm; }
        .brand { font-size: 16pt; font-weight: 700; color: #16324f; }
        .meta { width: 38%; margin-left: auto; }
        .meta td { padding: 1.2mm 0; }
        .address { margin: 6mm 0 8mm; line-height: 1.45; }
        .title { font-size: 17pt; font-weight: 700; color: #16324f; margin-bottom: 3mm; }
        .lead { line-height: 1.65; margin-bottom: 6mm; }
        .items th { background: #16324f; color: #fff; padding: 2.8mm 2mm; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 0.07em; }
        .items td { padding: 3mm 2mm; border-bottom: 1px solid #d9e1e8; vertical-align: top; }
        .totals { width: 84mm; margin-left: auto; margin-top: 6mm; }
        .totals td { padding: 1.5mm 1mm; }
        .grand td { border-top: 2px solid #16324f; font-weight: 700; color: #16324f; padding-top: 3mm; }
        .note { margin-top: 9mm; padding: 4mm 5mm; background: #f7fafc; border-left: 3px solid #16324f; line-height: 1.65; }
        .footer { position: fixed; bottom: -14mm; left: 0; right: 0; border-top: 1px solid #d1d5db; padding-top: 3mm; font-size: 7.3pt; color: #4b5563; }
    </style>
</head>
<body>
    @php
        $tenant = $project->tenant;
        $customer = $project->customer;
        $positions = $project->positions;
        $net = (float) ($project->price_total ?? $positions->sum(fn ($p) => (float) ($p->customer_total ?? 0)));
        $taxRate = 19;
        $tax = round($net * ($taxRate / 100), 2);
        $gross = $net + $tax;
        $customerName = $customer?->company_name ?: trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
    @endphp

    <div class="header">
        <div class="brand">{{ $tenant->company_name ?? $tenant->name }}</div>
        <table class="meta">
            <tr><td class="muted">Angebotsnummer</td><td class="text-right">{{ $project->project_number ?? $project->id }}</td></tr>
            <tr><td class="muted">Datum</td><td class="text-right">{{ now()->format('d.m.Y') }}</td></tr>
            <tr><td class="muted">Gueltig bis</td><td class="text-right">{{ now()->addDays(30)->format('d.m.Y') }}</td></tr>
            @if($project->customer_reference)<tr><td class="muted">Ihre Referenz</td><td class="text-right">{{ $project->customer_reference }}</td></tr>@endif
        </table>
    </div>

    <div class="address">
        <strong>{{ $customerName ?: 'Kunde' }}</strong><br>
        @if($customer?->address_street){{ trim($customer->address_street . ' ' . $customer->address_house_no) }}<br>@endif
        @if($customer?->address_zip || $customer?->address_city){{ trim(($customer->address_zip ?? '') . ' ' . ($customer->address_city ?? '')) }}<br>@endif
        @if($customer?->address_country){{ $customer->address_country }}@endif
    </div>

    <div class="title">Angebot</div>
    <div class="lead">
        Sehr geehrte Damen und Herren,<br><br>
        vielen Dank fuer Ihre Anfrage. Gemaess den uns vorliegenden Angaben bieten wir Ihnen die folgenden Sprachdienstleistungen zu den nachstehenden Konditionen an.
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width:7%;">Pos.</th>
                <th style="width:45%; text-align:left;">Leistung</th>
                <th style="width:12%;" class="text-right">Menge</th>
                <th style="width:11%;" class="text-right">Einheit</th>
                <th style="width:12%;" class="text-right">Preis</th>
                <th style="width:13%;" class="text-right">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            @forelse($positions as $index => $position)
                <tr>
                    <td class="text-right">{{ $index + 1 }}</td>
                    <td>{{ $position->description }}</td>
                    <td class="text-right">{{ number_format((float) ($position->quantity ?: $position->amount ?: 1), 2, ',', '.') }}</td>
                    <td class="text-right">{{ $position->unit ?: 'Einheit' }}</td>
                    <td class="text-right">{{ number_format((float) ($position->customer_rate ?? 0), 2, ',', '.') }} EUR</td>
                    <td class="text-right">{{ number_format((float) ($position->customer_total ?? 0), 2, ',', '.') }} EUR</td>
                </tr>
            @empty
                <tr>
                    <td class="text-right">1</td>
                    <td>{{ $project->project_name }}</td>
                    <td class="text-right">1,00</td>
                    <td class="text-right">Pauschal</td>
                    <td class="text-right">{{ number_format($net, 2, ',', '.') }} EUR</td>
                    <td class="text-right">{{ number_format($net, 2, ',', '.') }} EUR</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="muted">Netto</td><td class="text-right">{{ number_format($net, 2, ',', '.') }} EUR</td></tr>
        <tr><td class="muted">Umsatzsteuer {{ $taxRate }}%</td><td class="text-right">{{ number_format($tax, 2, ',', '.') }} EUR</td></tr>
        <tr class="grand"><td>Angebotssumme</td><td class="text-right">{{ number_format($gross, 2, ',', '.') }} EUR</td></tr>
    </table>

    <div class="note">
        Dieses Angebot gilt fuer 30 Kalendertage ab Ausstellungsdatum, sofern nicht schriftlich etwas Abweichendes vereinbart wird.<br><br>
        Liefertermin, Dateiformate und fachliche Anforderungen richten sich nach dem final freigegebenen Projektumfang. Aenderungen an Umfang oder Ausgangsdateien koennen eine Neuberechnung erforderlich machen.
    </div>

    <div class="footer">
        {{ $tenant->company_name ?? $tenant->name }} · {{ trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? '')) }} · {{ trim(($tenant->address_zip ?? '') . ' ' . ($tenant->address_city ?? '')) }}
        @if($tenant->email) · {{ $tenant->email }} @endif
        @if($tenant->website) · {{ $tenant->website }} @endif
    </div>
</body>
</html>
