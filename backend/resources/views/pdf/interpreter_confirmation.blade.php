<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Dolmetscherbestätigung {{ $project->project_number ?? $project->id }}</title>
    <style>
        @page {
            margin: 10mm 15mm 10mm 15mm;
        }

        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 10pt;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            position: relative;
        }

        /* Folding Mark */
        .folding-mark {
            position: absolute;
            left: -15mm;
            top: 105mm;
            width: 5mm;
            border-top: 0.5pt solid #000;
        }

        .header {
            text-align: center;
            margin-bottom: 1mm;
            position: relative;
            padding-top: 5mm;
        }

        .header-logo-container {
            position: relative;
            display: inline-block;
            margin-bottom: 1mm;
        }

        .globe-svg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40mm;
            height: 30mm;
            z-index: -1;
            opacity: 0.35;
        }

        .logo-text {
            font-size: 28pt;
            font-weight: bold;
            letter-spacing: 10pt;
            margin-bottom: 0;
            color: #000;
            position: relative;
        }

        .company-name {
            font-size: 16pt;
            font-weight: normal;
            margin-top: 0;
            letter-spacing: 1pt;
            text-transform: uppercase;
        }

        .slogan {
            font-size: 12pt;
            font-weight: normal;
            margin-top: 0;
            text-transform: uppercase;
        }

        .sub-slogan {
            font-size: 10pt;
            margin-top: 0;
            text-transform: uppercase;
        }

        .languages-list {
            font-size: 5.5pt;
            text-align: justify;
            margin: 2mm 0;
            line-height: 1.05;
            color: #333;
            text-transform: lowercase;
        }

        .container {
            width: 100%;
            margin-top: 5mm;
        }

        .left-col {
            float: left;
            width: 95mm;
        }

        .right-col {
            float: right;
            width: 75mm;
            text-align: right;
            font-size: 10pt;
        }

        .sender-small {
            font-size: 7.5pt;
            text-decoration: underline;
            margin-bottom: 3mm;
        }

        .recipient {
            font-size: 11pt;
            line-height: 1.2;
            margin-top: 1mm;
        }

        .contact-info {
            line-height: 1.25;
            text-align: left;
            margin-left: 5mm;
            font-size: 9.5pt;
        }

        .contact-info .pm-name {
            font-family: cursive;
            font-size: 14pt;
            font-weight: normal;
            color: #000;
            display: block;
            margin-bottom: -1mm;
        }

        .contact-info .pm-title {
            font-style: italic;
            font-size: 10pt;
            margin-bottom: 2mm;
            display: block;
        }

        .email-section {
            margin-top: 2mm;
            font-size: 9pt;
        }

        .underline-text {
            text-decoration: underline;
        }

        .reference-line {
            clear: both;
            margin-top: 8mm;
            width: 100%;
            border-collapse: collapse;
        }

        .reference-line td {
            font-size: 8.5pt;
            padding-bottom: 1mm;
        }

        .reference-val {
            font-size: 10pt;
            font-weight: bold;
            font-style: italic;
        }

        .salutation {
            margin-top: 8mm;
            font-size: 11pt;
        }

        .confirmation-box {
            margin-top: 5mm;
            border: 0.5pt solid #000;
            padding: 5mm;
            font-size: 11pt;
            line-height: 1.35;
            background-color: #fff;
        }

        .confirmation-box strong {
            font-weight: bold;
        }

        .disclaimer {
            margin-top: 6mm;
            font-size: 10.5pt;
            line-height: 1.3;
        }

        .footer-sig {
            margin-top: 6mm;
            width: 100%;
            position: relative;
        }

        .sig-itc-text {
            font-size: 20pt;
            font-weight: bold;
            letter-spacing: 16pt;
            margin-top: 3mm;
            display: block;
            color: #000;
        }

        .sig-stamp-placeholder {
            width: 60mm;
            height: 32mm;
            border: 1pt solid #4a90e2;
            color: #4a90e2;
            font-size: 8pt;
            text-align: center;
            padding: 2mm;
            line-height: 1.2;
            font-family: Arial, sans-serif;
            font-style: italic;
        }

        .employee-notice {
            width: 44mm;
            border: 0.8pt solid #000;
            padding: 2mm;
            font-size: 7.5pt;
            line-height: 1.15;
            text-align: left;
        }

        .employee-notice strong {
            display: block;
            border-bottom: 0.5pt solid #000;
            margin-bottom: 1.5mm;
            padding-bottom: 0.5mm;
        }

        .clear {
            clear: both;
        }
    </style>
</head>

<body>
    @php
        $tenant = $project->tenant;
        $settings = \App\Models\TenantSetting::where('tenant_id', $tenant->id)->pluck('value', 'key');
        $customer = $project->customer;
        $partner = $project->partner;
        $appointmentDate = $project->deadline ? $project->deadline->format('d.m.Y') : '__________';
        $appointmentTime = $project->deadline ? $project->deadline->format('H:i') . ' Uhr' : '__________';

        // Company data
        $companyName = $tenant->company_name ?? $tenant->name ?? 'Firma';
        $companyShort = strtoupper(preg_replace('/[^A-Z]/', '', strtoupper(substr($companyName, 0, 10))));
        $companyStreet = trim(($tenant->address_street ?? '') . ' ' . ($tenant->address_house_no ?? ''));
        $companyZip = $tenant->address_zip ?? '';
        $companyCity = $tenant->address_city ?? '';
        $companyCountry = $tenant->address_country ?? 'Deutschland';
        $companyPhone = $tenant->phone ?? $settings['phone'] ?? '';
        $companyFax = $tenant->fax ?? $settings['fax'] ?? '';
        $companyEmail = $tenant->email ?? $settings['email'] ?? $settings['company_email'] ?? '';
        $companyWebsite = $tenant->website ?? $settings['website'] ?? '';

        // Language
        $sourceLang = $project->sourceLanguage?->name ?? $project->source_language?->name ?? '';
        $targetLang = $project->targetLanguage?->name ?? $project->target_language?->name ?? $project->target ?? '__________';
        $language = $sourceLang ?: $targetLang;

        $additionalLangs = [];
        foreach ($project->positions as $pos) {
            if (preg_match('/(albanisch|arabisch|bulgarisch|dari|englisch|farsi|französisch|griechisch|italienisch|kurdisch|paschtu|polnisch|portugiesisch|rumänisch|russisch|serbisch|spanisch|türkisch|ukrainisch|urdu|vietnamesisch)/i', $pos->description, $matches)) {
                $found = ucfirst(strtolower($matches[1]));
                if ($found != $sourceLang && $found != $targetLang) {
                    $additionalLangs[] = $found;
                }
            }
        }
        if (!empty($additionalLangs)) {
            $language .= " sowie " . implode(", ", array_unique($additionalLangs));
        }

        // Partner salutation
        $partnerSalutation = '';
        $interpreterName = '__________';
        if ($partner) {
            $interpreterName = trim($partner->first_name . ' ' . $partner->last_name);
            $sal = $partner->salutation ?? null;
            if ($sal === 'Herr' || $sal === 'herr' || $sal === 'mr') {
                $partnerSalutation = 'Unser Dolmetscher, Herr';
            } elseif ($sal === 'Frau' || $sal === 'frau' || $sal === 'mrs' || $sal === 'ms') {
                $partnerSalutation = 'Unsere Dolmetscherin, Frau';
            } else {
                // Fallback: neutral
                $partnerSalutation = 'Unser/e Dolmetscher/in';
            }
        }

        $location = $project->appointment_location ?: '__________';

        $languages = "afrikaans albanisch amharisch arabisch aramäisch aserbaidschanisch assyrisch bassa balutschi bengali birmanisch bulgarisch brasilianisch cebuano chinesisch dänisch dari divehi dogon dzongkha englisch estnisch ewe finnisch französisch gälisch ghanaisch griechisch gujarati haussa hebräisch hindi holländisch indonesisch italienisch japanisch kasachisch katalanisch kibundi kikuyu kirgisisch koreanisch kurdisch kurmanchi latein lettisch lingala litauisch makedonisch malaysisch mandingo mongolisch moussi nepali norwegisch persisch polnisch portugiesisch punjabi rumänisch russisch schwedisch serbokroatisch sesotha slowakisch slowenisch sourani spanisch suaheli tagalog tamil thai tonga tschechisch tumbuka türkisch turkmenisch twi ukrainisch ungarisch urdu usbekisch vietnamesisch wollof zaza";
    @endphp

    <div class="folding-mark"></div>

    <div class="header">
        <div class="header-logo-container">
            <svg class="globe-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#2e7d32" stroke-width="0.5" />
                <ellipse cx="50" cy="50" rx="48" ry="18" fill="none" stroke="#2e7d32" stroke-width="0.5" />
                <ellipse cx="50" cy="50" rx="18" ry="48" fill="none" stroke="#2e7d32" stroke-width="0.5" />
                <line x1="50" y1="2" x2="50" y2="98" stroke="#2e7d32" stroke-width="0.5" />
                <line x1="2" y1="50" x2="98" y2="50" stroke="#2e7d32" stroke-width="0.5" />
                <ellipse cx="50" cy="50" rx="48" ry="35" fill="none" stroke="#2e7d32" stroke-width="0.3" />
                <ellipse cx="50" cy="50" rx="35" ry="48" fill="none" stroke="#2e7d32" stroke-width="0.3" />
            </svg>
            <div class="logo-text">{{ $companyShort }}</div>
        </div>
        <div class="company-name">{{ $companyName }}</div>
        <div class="slogan">DOLMETSCHER- & ÜBERSETZUNGSBÜRO</div>
        <div class="sub-slogan">FÜR ALLE WELTSPRACHEN</div>
    </div>

    <div class="languages-list">
        {{ $languages }}
    </div>

    <div class="container">
        <div class="left-col">
            <div class="sender-small">
                {{ $companyName }} * {{ $companyStreet }} * D-{{ $companyZip }} {{ $companyCity }}
            </div>
            <div class="recipient">
                <strong>{{ $customer->company_name ?? ($customer->first_name . ' ' . $customer->last_name) }}</strong><br>
                @if($customer->department) {{ $customer->department }}<br> @endif
                {{ $customer->address_street ?? $customer->address }} {{ $customer->address_house_no }}<br>
                {{ $customer->address_zip ?? $customer->zip }} {{ $customer->address_city ?? $customer->city }}
            </div>
        </div>

        <div class="right-col">
            <div class="contact-info">
                <span class="pm-name">{{ $project->creator->name ?? auth()->user()->name ?? '' }}</span>
                <span class="pm-title">Kundenservice</span>

                {{ $companyStreet }}<br>
                D-{{ $companyZip }} {{ $companyCity }}<br>
                @if($companyPhone)
                    ☏ {{ $companyPhone }}
                @endif
                @if($companyFax)
                    📠 {{ $companyFax }}
                @endif
                <br>

                <div class="email-section">
                    <span class="underline-text">E-Mail- und Internetadresse:</span><br>
                    @if($companyEmail) {{ $companyEmail }}<br> @endif
                    @if($companyWebsite) {{ $companyWebsite }} @endif
                </div>
            </div>
        </div>
    </div>

    <div class="clear"></div>

    <table class="reference-line">
        <tr>
            <td width="20%">Ihr Zeichen</td>
            <td width="25%">Ihr Schreiben vom</td>
            <td width="20%">Unser Zeichen</td>
            <td style="text-align: right;">{{ $companyCity }}, den {{ date('d.m.Y') }}</td>
        </tr>
        <tr>
            <td class="reference-val">{{ $project->customer_reference ?: '---' }}</td>
            <td class="reference-val">{{ $project->customer_date ? $project->customer_date->format('d.m.Y') : '---' }}
            </td>
            <td class="reference-val">{{ $project->project_number }}</td>
            <td></td>
        </tr>
    </table>

    <div class="salutation">
        Sehr geehrte Damen und Herren,
    </div>

    <div class="confirmation-box">
        hiermit bestätigen wir den Dolmetschereinsatz für die <strong>{{ $language }}</strong>
        Sprache am <strong>{{ $appointmentDate }}</strong> um <strong>{{ $appointmentTime }}</strong>
        @if($location !== '__________')
            im <strong>{{ $location }}</strong>@if($project->address_street || $project->address_zip),
                {{ trim(($project->address_street ?? '') . ' ' . ($project->address_house_no ?? '')) }},
                {{ $project->address_zip }} {{ $project->address_city }}@if($project->address_country),
            {{ $project->address_country }}@endif @endif.
        @else
            am vereinbarten Einsatzort.
        @endif
        <br>
        {{ $partnerSalutation }} <strong>{{ $interpreterName }}</strong>, wird den Termin
        wahrnehmen und zum vereinbarten Zeitpunkt am Einsatzort erscheinen.
    </div>

    <div class="disclaimer">
        Die Verantwortung für die Richtigkeit des Dolmetschens trägt das vereidigte<br>
        Dolmetscher- & Übersetzungsbüro {{ $companyName }}.
    </div>

    <div class="footer-sig">
        <table style="width: 100%; border-collapse: collapse; margin-top: 5mm;">
            <tr>
                <td style="width: 25%; vertical-align: top;">
                    Hochachtungsvoll<br><br>
                    <span class="sig-itc-text">{{ $companyShort }}</span>
                </td>
                <td style="width: 5%;"></td>
                <td style="width: 35%; vertical-align: top;">
                    <div class="sig-stamp-placeholder">
                        <div style="font-size: 9pt; font-weight: bold; margin-bottom: 1mm;">{{ $companyShort }}</div>
                        {{ $companyName }}<br>
                        Dolmetscher- & Übersetzungsbüro<br>
                        für alle Weltsprachen<br>
                        {{ $companyStreet }}<br>
                        D-{{ $companyZip }} {{ $companyCity }}<br>
                        @if($companyPhone) Telefon {{ $companyPhone }}<br> @endif
                        @if($companyEmail) E-Mail: {{ $companyEmail }}<br> @endif
                        @if($companyWebsite) Internet: {{ $companyWebsite }} @endif
                    </div>
                </td>
                <td style="width: 5%;"></td>
                <td style="width: 30%; vertical-align: top; text-align: right;">
                    <div class="employee-notice" style="float: right;">
                        <strong>MITTEILUNG AN<br>UNSERE MITARBEITER!:</strong><br><br>
                        Legen Sie bei Ihren Einsätzen bitte immer unsere Einsatzbestätigung sowie Ihren Personalausweis
                        oder Reisepass vor!
                    </div>
                </td>
            </tr>
        </table>
    </div>

</body>

</html>