<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Auftragsverarbeitungsvertrag (AVV)</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 16pt;
            margin: 0;
        }

        .header p {
            font-size: 9pt;
            color: #666;
            margin: 5px 0 0;
        }

        .section {
            margin-bottom: 20px;
        }

        .section h2 {
            font-size: 12pt;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }

        .section h3 {
            font-size: 11pt;
            margin-bottom: 5px;
        }

        .parties {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            font-size: 10pt;
        }

        .party {
            display: table-cell;
            width: 48%;
            vertical-align: top;
            background: #f9f9f9;
            padding: 10px;
            border: 1px solid #eee;
        }

        .party h3 {
            margin-top: 0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            text-align: center;
            font-size: 8pt;
            color: #999;
        }

        .signature-block {
            margin-top: 50px;
            page-break-inside: avoid;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 80%;
            margin-top: 40px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Vereinbarung zur Auftragsverarbeitung</h1>
        <p>gemäß Artikel 28 Datenschutz-Grundverordnung (DSGVO)</p>
    </div>

    <div class="parties">
        <div class="party" style="margin-right: 4%;">
            <h3>Auftraggeber (Verantwortlicher):</h3>
            <p>
                <strong>{{ $project->customer?->company_name ?? (($project->customer?->first_name . ' ' . $project->customer?->last_name) ?: 'Musterkunde') }}</strong><br>
                {{ $project->customer?->address_street ?? '' }} {{ $project->customer?->address_house_no ?? '' }}<br>
                {{ $project->customer?->address_zip ?? '' }} {{ $project->customer?->address_city ?? '' }}<br>
                {{ $project->customer?->address_country ?? 'Deutschland' }}
            </p>
        </div>
        <div class="party">
            <h3>Auftragnehmer (Auftragsverarbeiter):</h3>
            <p>
                <strong>{{ $project->tenant?->company_name ?? 'Translation Office' }}</strong><br>
                {{ $project->tenant?->address_street ?? '' }} {{ $project->tenant?->address_house_no ?? '' }}<br>
                {{ $project->tenant?->address_zip ?? '' }} {{ $project->tenant?->address_city ?? '' }}<br>
                {{ $project->tenant?->address_country ?? 'Deutschland' }}
            </p>
        </div>
    </div>

    <div class="section">
        <h2>Präambel</h2>
        <p>
            Diese Vereinbarung konkretisiert die datenschutzrechtlichen Verpflichtungen der Vertragsparteien, die sich
            aus der im Hauptvertrag beschriebenen Auftragsverarbeitung ergeben. Sie findet Anwendung auf alle
            Tätigkeiten, bei denen Mitarbeiter des Auftragnehmers oder durch ihn beauftragte Dritte personenbezogene
            Daten des Auftraggebers verarbeiten.
        </p>
    </div>

    <div class="section">
        <h2>1. Gegenstand und Dauer des Auftrags</h2>
        <p>
            (1) Gegenstand: Der Auftragnehmer erbringt für den Auftraggeber Dienstleistungen im Bereich Übersetzung,
            Dolmetschen oder Lektorat. Hierbei werden personenbezogene Daten verarbeitet (z.B. Namen in Dokumenten,
            Kontaktdaten).<br>
            (2) Dauer: Die Dauer dieser Vereinbarung richtet sich nach der Laufzeit des Hauptvertrages.
        </p>
    </div>

    <div class="section">
        <h2>2. Art und Zweck der Verarbeitung</h2>
        <p>
            Die Verarbeitung erfolgt zu Zwecken der Übersetzung und Bearbeitung von Dokumenten sowie der damit
            verbundenen Kommunikation und Abrechnung. Art der Daten: Personenstammdaten, Kommunikationsdaten, sowie ggf.
            besondere Datenkategorien, die in den zu übersetzenden Texten enthalten sind (z.B. Gesundheitsdaten in
            medizinischen Befunden). Kreis der Betroffenen: Kunden, Mitarbeiter, Lieferanten des Auftraggebers.
        </p>
    </div>

    <div class="section">
        <h2>3. Pflichten des Auftragnehmers</h2>
        <p>
            Der Auftragnehmer verpflichtet sich, Daten nur im Rahmen der Weisungen des Auftraggebers zu verarbeiten. Er
            sichert zu, dass alle mit der Verarbeitung betrauten Personen zur Vertraulichkeit verpflichtet wurden. Der
            Auftragnehmer trifft angemessene technische und organisatorische Maßnahmen zum Schutz der Daten gemäß Art.
            32 DSGVO.
        </p>
    </div>

    <div class="section">
        <h2>4. Unterauftragsverhältnisse</h2>
        <p>
            Der Auftraggeber stimmt zu, dass der Auftragnehmer Subunternehmer (z.B. freiberufliche Übersetzer)
            hinzuzieht, sofern diese vertraglich auf ein vergleichbares Datenschutzniveau verpflichtet werden.
        </p>
    </div>

    <div class="section">
        <h2>5. Kontrollrechte</h2>
        <p>
            Der Auftraggeber hat das Recht, die Einhaltung der Pflichten gemäß dieser Vereinbarung beim Auftragnehmer zu
            überprüfen.
        </p>
    </div>

    <div class="section">
        <h2>6. Laufzeit und Kündigung</h2>
        <p>
            Diese Vereinbarung gilt unbegrenzt, solange der Auftragnehmer personenbezogene Daten im Auftrag des
            Auftraggebers verarbeitet. Sie endet automatisch mit Beendigung des Hauptvertrages.
        </p>
    </div>

    <div class="signature-block">
        <p>Ort, Datum: ____________________________________</p>
        <br><br>
        <div class="parties">
            <div class="party" style="border: none; background: none;">
                <div class="signature-line"></div>
                Unterschrift Auftraggeber
            </div>
            <div class="party" style="border: none; background: none;">
                <div class="signature-line"></div>
                Unterschrift Auftragnehmer
            </div>
        </div>
    </div>

    <div class="footer">
        Seite <span class="page-number">1</span> von <span class="page-count">1</span> | AV-Vertrag |
        {{ $project->project_number ?? '' }}
    </div>
</body>

</html>