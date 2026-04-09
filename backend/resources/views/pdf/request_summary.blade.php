<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Anfrage {{ $project->project_number ?? $project->id }}</title>
    <style>
        @page { margin: 20mm; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #17212b; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        .text-right { text-align: right; }
        .muted { color: #5b6572; }
        .headline { font-size: 16pt; font-weight: 700; color: #23415f; margin-bottom: 5mm; }
        .section { margin-top: 8mm; }
        .section-title { margin-bottom: 2mm; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #23415f; }
        .box { border: 1px solid #d6dde5; padding: 4mm; background: #fbfcfe; }
        .grid td { padding: 1.4mm 0; vertical-align: top; }
        .items th { background: #edf2f7; color: #23415f; padding: 2.8mm 2mm; text-transform: uppercase; font-size: 7.6pt; text-align: left; }
        .items td { padding: 2.8mm 2mm; border-bottom: 1px solid #e2e8f0; }
        .footer { position: fixed; bottom: -10mm; left: 0; right: 0; border-top: 1px solid #d1d5db; padding-top: 2.5mm; font-size: 7.3pt; color: #4b5563; }
    </style>
</head>
<body>
    @php
        $customer = $project->customer;
        $partner = $project->partner;
        $customerName = $customer?->company_name ?: trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? ''));
        $partnerName = $partner?->company ?: trim(($partner?->first_name ?? '') . ' ' . ($partner?->last_name ?? ''));
    @endphp

    <div class="headline">Anfragezusammenfassung</div>

    <div class="box">
        Diese Uebersicht dokumentiert die eingegangene Kundenanfrage in komprimierter Form und dient der internen Bearbeitung sowie der nachvollziehbaren Angebotsvorbereitung.
    </div>

    <div class="section">
        <div class="section-title">Vorgang</div>
        <table class="grid">
            <tr><td class="muted" style="width:32%;">Vorgangsnummer</td><td>{{ $project->project_number ?? $project->id }}</td></tr>
            <tr><td class="muted">Projektbezeichnung</td><td>{{ $project->project_name }}</td></tr>
            <tr><td class="muted">Status</td><td>{{ $project->status ?? 'offen' }}</td></tr>
            <tr><td class="muted">Anfragedatum</td><td>{{ optional($project->customer_date)->format('d.m.Y') ?: optional($project->created_at)->format('d.m.Y H:i') }}</td></tr>
            @if($project->deadline)<tr><td class="muted">Gewuenschter Termin</td><td>{{ $project->deadline->format('d.m.Y H:i') }}</td></tr>@endif
            @if($project->documentType)<tr><td class="muted">Dokumenttyp</td><td>{{ $project->documentType->name ?? '-' }}</td></tr>@endif
            @if($project->sourceLanguage || $project->targetLanguage)<tr><td class="muted">Sprachkombination</td><td>{{ $project->sourceLanguage->name ?? '-' }} → {{ $project->targetLanguage->name ?? '-' }}</td></tr>@endif
        </table>
    </div>

    <div class="section">
        <div class="section-title">Anfragesteller</div>
        <table class="grid">
            <tr><td class="muted" style="width:32%;">Kunde</td><td>{{ $customerName ?: '-' }}</td></tr>
            @if($customer?->contact_person)<tr><td class="muted">Ansprechperson</td><td>{{ $customer->contact_person }}</td></tr>@endif
            @if($customer?->email)<tr><td class="muted">E-Mail</td><td>{{ $customer->email }}</td></tr>@endif
            @if($customer?->phone)<tr><td class="muted">Telefon</td><td>{{ $customer->phone }}</td></tr>@endif
            @if($customer?->address_street || $customer?->address_city)<tr><td class="muted">Adresse</td><td>{{ trim(($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? '')) }}, {{ trim(($customer->address_zip ?? '') . ' ' . ($customer->address_city ?? '')) }}</td></tr>@endif
        </table>
    </div>

    <div class="section">
        <div class="section-title">Leistungsumfang</div>
        <table class="items">
            <thead>
                <tr>
                    <th style="width:55%;">Position</th>
                    <th style="width:15%;" class="text-right">Menge</th>
                    <th style="width:15%;" class="text-right">Einheit</th>
                    <th style="width:15%;" class="text-right">Kundenwert</th>
                </tr>
            </thead>
            <tbody>
                @forelse($project->positions as $position)
                    <tr>
                        <td>{{ $position->description }}</td>
                        <td class="text-right">{{ number_format((float) ($position->quantity ?: $position->amount ?: 1), 2, ',', '.') }}</td>
                        <td class="text-right">{{ $position->unit ?: '-' }}</td>
                        <td class="text-right">{{ number_format((float) ($position->customer_total ?? 0), 2, ',', '.') }} EUR</td>
                    </tr>
                @empty
                    <tr>
                        <td>{{ $project->project_name }}</td>
                        <td class="text-right">1,00</td>
                        <td class="text-right">Pauschal</td>
                        <td class="text-right">{{ number_format((float) ($project->price_total ?? 0), 2, ',', '.') }} EUR</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Bearbeitungshinweise</div>
        <div class="box">
            @if($project->notes)
                {!! nl2br(e($project->notes)) !!}
            @else
                Keine weiteren Hinweise hinterlegt.
            @endif
            @if($partnerName)
                <br><br>Zugeordneter Partner: <strong>{{ $partnerName }}</strong>
            @endif
        </div>
    </div>

    <div class="footer">
        Interne Bearbeitungsunterlage · {{ $project->tenant->company_name ?? $project->tenant->name ?? 'Translation Office' }}
    </div>
</body>
</html>
