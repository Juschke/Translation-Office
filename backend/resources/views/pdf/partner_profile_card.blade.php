<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Partnerprofil {{ $partner->display_id ?: $partner->id }}</title>
    <style>
        @page { margin: 16mm; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #17212b; margin: 0; }
        .card { border: 1px solid #d5dde6; border-radius: 4mm; overflow: hidden; }
        .hero { padding: 7mm; background: #183b56; color: #fff; }
        .headline { font-size: 16pt; font-weight: 700; }
        .sub { margin-top: 1.5mm; font-size: 8pt; opacity: 0.9; }
        .body { padding: 7mm; }
        .section { margin-top: 6mm; }
        .section:first-child { margin-top: 0; }
        .label { margin-bottom: 2mm; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #183b56; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1.3mm 0; vertical-align: top; }
        .muted { width: 34%; color: #5b6572; }
        .badge { display: inline-block; margin: 0 1.5mm 1.5mm 0; padding: 1.2mm 2.5mm; border: 1px solid #d6dde5; border-radius: 999px; font-size: 8pt; }
    </style>
</head>
<body>
    @php
        $name = $partner->company ?: trim(($partner->first_name ?? '') . ' ' . ($partner->last_name ?? ''));
    @endphp

    <div class="card">
        <div class="hero">
            <div class="headline">{{ $name ?: 'Partnerprofil' }}</div>
            <div class="sub">{{ $partner->display_id ?: $partner->id }} · {{ $partner->type ?: 'Partner' }} · Status: {{ $partner->status ?: 'offen' }}</div>
        </div>

        <div class="body">
            <div class="section">
                <div class="label">Basisdaten</div>
                <table>
                    <tr><td class="muted">Name / Firma</td><td>{{ $name ?: '-' }}</td></tr>
                    <tr><td class="muted">E-Mail</td><td>{{ $partner->email ?: '-' }}</td></tr>
                    <tr><td class="muted">Telefon</td><td>{{ $partner->phone ?: ($partner->mobile ?: '-') }}</td></tr>
                    <tr><td class="muted">Adresse</td><td>{{ trim(($partner->address_street ?? '') . ' ' . ($partner->address_house_no ?? '')) }} {{ trim(($partner->address_zip ?? '') . ' ' . ($partner->address_city ?? '')) }}</td></tr>
                    <tr><td class="muted">Zahlungsziel</td><td>{{ $partner->payment_terms ? $partner->payment_terms . ' Tage' : '-' }}</td></tr>
                </table>
            </div>

            <div class="section">
                <div class="label">Fachprofil</div>
                @if(!empty($partner->languages))
                    @foreach($partner->languages as $language)
                        <span class="badge">{{ $language }}</span>
                    @endforeach
                @else
                    Keine Sprachangaben hinterlegt.
                @endif
                <div style="margin-top: 4mm;"></div>
                @if(!empty($partner->domains))
                    @foreach($partner->domains as $domain)
                        <span class="badge">{{ $domain }}</span>
                    @endforeach
                @endif
            </div>

            <div class="section">
                <div class="label">Abrechnung</div>
                <table>
                    <tr><td class="muted">Preislogik</td><td>{{ $partner->price_mode ?: '-' }}</td></tr>
                    <tr><td class="muted">Bank</td><td>{{ $partner->bank_name ?: '-' }}</td></tr>
                    <tr><td class="muted">IBAN</td><td>{{ $partner->iban ?: '-' }}</td></tr>
                    <tr><td class="muted">BIC</td><td>{{ $partner->bic ?: '-' }}</td></tr>
                    <tr><td class="muted">Steuer-ID</td><td>{{ $partner->tax_id ?: '-' }}</td></tr>
                </table>
            </div>

            <div class="section">
                <div class="label">Notizen</div>
                <div>{{ $partner->notes ?: 'Keine internen Hinweise hinterlegt.' }}</div>
            </div>
        </div>
    </div>
</body>
</html>
