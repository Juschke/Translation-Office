<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Kundenstammdaten {{ $customer->display_id ?: $customer->id }}</title>
    <style>
        @page { margin: 18mm; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #1a2430; margin: 0; }
        .header { margin-bottom: 7mm; padding-bottom: 4mm; border-bottom: 2px solid #17324f; }
        .title { font-size: 17pt; font-weight: 700; color: #17324f; }
        .sub { margin-top: 1.5mm; color: #5b6572; }
        .section { margin-top: 8mm; }
        .section-title { margin-bottom: 2mm; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #17324f; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1.6mm 0; vertical-align: top; border-bottom: 1px solid #eef2f6; }
        .label { width: 32%; color: #5b6572; }
        .badge { display: inline-block; padding: 1mm 2.3mm; border-radius: 999px; border: 1px solid #d7dee6; font-size: 8pt; margin-right: 1.5mm; }
    </style>
</head>
<body>
    @php
        $name = $customer->company_name ?: trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''));
    @endphp

    <div class="header">
        <div class="title">Kundenstammdaten</div>
        <div class="sub">{{ $customer->display_id ?: $customer->id }} · {{ $name ?: 'Kunde' }}</div>
    </div>

    <div class="section">
        <div class="section-title">Allgemein</div>
        <table>
            <tr><td class="label">Kunde</td><td>{{ $name ?: '-' }}</td></tr>
            <tr><td class="label">Kundentyp</td><td>{{ $customer->type ?: '-' }}</td></tr>
            <tr><td class="label">Ansprechperson</td><td>{{ $customer->contact_person ?: '-' }}</td></tr>
            <tr><td class="label">Status</td><td>{{ $customer->status ?: '-' }}</td></tr>
            <tr><td class="label">Preisgruppe</td><td>{{ $customer->priceMatrix->name ?? '-' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Kontakt</div>
        <table>
            <tr><td class="label">E-Mail</td><td>{{ $customer->email ?: '-' }}</td></tr>
            <tr><td class="label">Weitere E-Mails</td><td>{{ !empty($customer->additional_emails) ? implode(', ', $customer->additional_emails) : '-' }}</td></tr>
            <tr><td class="label">Telefon</td><td>{{ $customer->phone ?: '-' }}</td></tr>
            <tr><td class="label">Mobil</td><td>{{ $customer->mobile ?: '-' }}</td></tr>
            <tr><td class="label">Weitere Rufnummern</td><td>{{ !empty($customer->additional_phones) ? implode(', ', $customer->additional_phones) : '-' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Adresse und Faktura</div>
        <table>
            <tr><td class="label">Anschrift</td><td>{{ trim(($customer->address_street ?? '') . ' ' . ($customer->address_house_no ?? '')) }}</td></tr>
            <tr><td class="label">PLZ / Ort</td><td>{{ trim(($customer->address_zip ?? '') . ' ' . ($customer->address_city ?? '')) }}</td></tr>
            <tr><td class="label">Land</td><td>{{ $customer->address_country ?: '-' }}</td></tr>
            <tr><td class="label">Leitweg-ID</td><td>{{ $customer->leitweg_id ?: '-' }}</td></tr>
            <tr><td class="label">Zahlungsziel</td><td>{{ $customer->payment_terms_days !== null ? $customer->payment_terms_days . ' Tage' : '-' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Steuer und Bank</div>
        <table>
            <tr><td class="label">Rechtsform</td><td>{{ $customer->legal_form ?: '-' }}</td></tr>
            <tr><td class="label">Steuer-ID</td><td>{{ $customer->tax_id ?: '-' }}</td></tr>
            <tr><td class="label">USt-IdNr.</td><td>{{ $customer->vat_id ?: '-' }}</td></tr>
            <tr><td class="label">Kontoinhaber</td><td>{{ $customer->bank_account_holder ?: '-' }}</td></tr>
            <tr><td class="label">Bank</td><td>{{ $customer->bank_name ?: '-' }}</td></tr>
            <tr><td class="label">IBAN / BIC</td><td>{{ trim(($customer->iban ?: '-') . ' / ' . ($customer->bic ?: '-')) }}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Hinweise</div>
        <div>{{ $customer->notes ?: 'Keine internen Hinweise hinterlegt.' }}</div>
    </div>
</body>
</html>
