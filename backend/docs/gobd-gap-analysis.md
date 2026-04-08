# GoBD- Und Revisionssicherheits-Gap-Analyse

Stand: 8. April 2026
System: Translation Office Backend
Scope: Rechnungsstellung, Mahnwesen, E-Rechnung, Buchhaltungsnahe Daten

## 1. Zielbild

Diese Analyse bewertet, wie nah die aktuelle Anwendung an folgenden Anforderungen liegt:

- GoBD-konforme Erfassung, Verarbeitung und Aufbewahrung
- steuerlich belastbare Rechnungsstellung nach deutschem Umsatzsteuerrecht
- technische und organisatorische Revisionssicherheit
- E-Rechnungsfaehigkeit fuer Deutschland und relevante EU-Anforderungen

Bewertungslogik:

- `Erfuellt`: fachlich und technisch weitgehend belastbar umgesetzt
- `Teilweise erfuellt`: gute Grundlage vorhanden, aber mit relevanten Restluecken
- `Nicht erfuellt`: derzeit keine belastbare Umsetzung

## 2. Gesamtfazit

Gesamtbewertung: `Teilweise erfuellt`

Die Anwendung enthaelt bereits mehrere starke Bausteine:

- Snapshots fuer Rechnungsadress- und Stammdaten
- centgenaue Geldspeicherung
- Sperrlogik fuer ausgestellte Rechnungen
- fortlaufende Rechnungsnummern
- Audit- und Activity-Logging
- ZUGFeRD-/XRechnung-Ansatz im Backend

Fuer eine belastbare Freigabe als revisionssicheres und GoBD-taugliches Produkt fehlen jedoch noch technische und organisatorische Sicherungen, insbesondere bei:

- Unveraenderbarkeit ausserhalb des Eloquent-Modells
- beweisfaehiger Archivierung
- belastbarer Verfahrensdokumentation
- hartem Pflichtfeld- und Freigabeworkflow
- kontrollierter Berichtigung ueber echte Gegenbelege

## 3. Bewertungsmatrix

| Bereich | Bewertung | Kurzfazit |
|---|---|---|
| Rechnungsnummern | Teilweise erfuellt | fortlaufend angelegt, aber Absicherung gegen alle Sonderfaelle fehlt |
| Rechnungsinhalte / Pflichtangaben | Teilweise erfuellt | viele Felder vorhanden, Validierung vor Ausstellung noch nicht hart genug |
| Unveraenderbarkeit | Teilweise erfuellt | Modellschutz vorhanden, aber durch direkte Updates technisch umgehbar |
| Storno / Berichtigung | Teilweise erfuellt | fachlich vorgesehen, aber Gegenbeleg-Workflow noch nicht voll belegt |
| Audit-Trail | Teilweise erfuellt | Audit-Tabellen vorhanden, aber nicht beweissicher gegen Manipulation abgesichert |
| Archivierung / Aufbewahrung | Nicht erfuellt | keine nachgewiesene unveraenderbare Ablage, keine Hash-/Signaturstrategie |
| E-Rechnung Deutschland | Teilweise erfuellt | XRechnung/ZUGFeRD vorhanden, aber Datenvollstaendigkeit und Validierung kritisch |
| Export / Pruefbarkeit | Teilweise erfuellt | Ansatze vorhanden, aber keine klar dokumentierte Pruefer-Schnittstelle |
| Rollen / Freigaben | Teilweise erfuellt | Basis vorhanden, aber formaler Freigabeworkflow fuer Ausstellung fehlt |
| Verfahrensdokumentation | Nicht erfuellt | bisher keine belastbare Soll-/Ist-Dokumentation fuer den Gesamtprozess |

## 4. Kritische Luecken Mit Prioritaet

## 4.1 P1: Unveraenderbarkeit kann umgangen werden

Status: `Kritisch`

Beobachtung:

- Das Modell [Invoice.php](/C:/xampp/htdocs/Translation-Office/backend/app/Models/Invoice.php) sperrt ausgestellte Rechnungen ueber Model-Events.
- In [InvoiceController.php](/C:/xampp/htdocs/Translation-Office/backend/app/Http/Controllers/Api/InvoiceController.php) existieren aber auch direkte Query-Updates, insbesondere bei Bulk-Operationen.
- Solche Updates laufen nicht zwingend durch dieselben Eloquent-Schutzpfade.

Risiko:

- ausgestellte Rechnungen koennen technisch anders veraendert werden als fachlich beabsichtigt
- Nachweis der Unveraenderbarkeit waere bei einer Pruefung angreifbar

Soll-Zustand:

- keine Aenderung ausgestellter Rechnungen ueber ungeschuetzte Query-Builder-Updates
- zentrale Domain-Regel fuer erlaubte Statuswechsel
- harte Service-/Policy-Schicht fuer alle Rechnungsstatus-Aenderungen
- idealerweise DB-seitige Sicherungen oder nachvollziehbare Sperrstrategie

## 4.2 P1: Archivierung ist nicht beweissicher

Status: `Kritisch`

Beobachtung:

- PDF/XML werden erzeugt und im Dateisystem abgelegt
- es gibt derzeit keinen erkennbaren Schutz gegen spaeteres Ersetzen oder stilles Ueberschreiben
- keine Hash-Speicherung, keine Signatur, keine Versionierung, keine WORM-nahe Strategie

Risiko:

- archivierte Belege koennen technisch veraenderbar sein
- Nachweis von Authentizitaet, Integritaet und Lesbarkeit ueber Jahre ist schwach

Soll-Zustand:

- Hash pro ausgegebener Rechnungsdatei
- Hash in Datenbank mit Zeitstempel und Erzeugungskontext speichern
- unveraenderbare oder versionierte Ablage
- pruefbarer Rebuild-/Restore-Prozess

## 4.3 P1: Pflichtangaben werden vor Ausstellung nicht streng genug erzwungen

Status: `Kritisch`

Beobachtung:

- viele Snapshot- und Steuerfelder sind vorhanden
- aber die Ausstellung wirkt nicht ueber einen formalen Compliance-Check blockiert
- Fallbacks und Platzhalter koennen XML-Erzeugung zwar retten, sind aber steuerlich nicht immer belastbar

Risiko:

- Rechnung wird technisch erstellt, obwohl Pflichtangaben fehlen
- B2B-/B2G- oder Reverse-Charge-Faelle koennen inhaltlich falsch ausgegeben werden

Soll-Zustand:

- `issue()` darf nur nach bestandenem Pflichtfeld-Check durchlaufen
- getrennte Regeln fuer:
  - Inland B2B/B2C
  - EU B2B Reverse Charge
  - Oeffentliche Auftraggeber / Leitweg-ID
  - Kleinunternehmerregelung

## 4.4 P1: Storno- und Berichtigungsprozess ist nicht vollstaendig abgesichert

Status: `Kritisch`

Beobachtung:

- im Controller ist das Storno fachlich beschrieben
- im sichtbaren Ablauf wird aber primaer der Status des Originals geaendert
- der vollstaendige, immutable Gegenbeleg mit Referenzkette muss belastbar und nachvollziehbar im Standardprozess entstehen

Risiko:

- Korrekturen sind fachlich nicht stark genug dokumentiert
- Original und Berichtigung koennen in Pruefung nicht sauber als Belegkette nachgewiesen werden

Soll-Zustand:

- Original bleibt unveraendert archiviert
- Gegenbeleg wird mit eigener Nummer, Referenz auf Ursprungsbeleg und negierten Positionen erzeugt
- beide Belege werden auditierbar miteinander verknuepft

## 4.5 P1: Audit-Logs sind fachlich sinnvoll, aber nicht manipulationsresistent

Status: `Kritisch`

Beobachtung:

- `invoice_audit_logs` und `activity_log` existieren
- keine erkennbare Sicherung gegen stilles Loeschen oder nachtraegliches Ueberschreiben

Risiko:

- Audit-Trail verliert Beweiswert

Soll-Zustand:

- Append-only-Strategie
- keine regulare UI/API fuer Aendern oder Loeschen
- optional Hash-Verkettung oder externer Log-Sink

## 5. Wichtige Luecken Mit Mittlerer Prioritaet

## 5.1 P2: Verfahrensdokumentation fehlt

Status: `Nicht erfuellt`

Es fehlt eine offiziell gepflegte Dokumentation zu:

- Systemgrenzen
- Rollen und Verantwortungen
- Prozess von Entwurf bis Archiv
- Ausnahmen und Fehlerfaellen
- Backup, Restore und Prueferzugriff

## 5.2 P2: Export fuer Betriebspruefung ist nicht als Standardprozess dokumentiert

Status: `Teilweise erfuellt`

Es gibt Buchhaltungs-/Exportlogik, aber kein dokumentiertes Prueferpaket mit:

- Rechnungsstammdaten
- Positionen
- Audit-Trail
- Datei-Hashes
- Mahnverlauf

## 5.3 P2: Aufbewahrungs- und Loeschkonzept fehlt

Status: `Nicht erfuellt`

Es ist nicht klar dokumentiert:

- welche Daten 8 Jahre oder laenger vorgehalten werden
- wann Loeschung erlaubt ist
- wie Soft Deletes von echten Aufbewahrungspflichten getrennt werden

## 5.4 P2: Rollen- und Freigabekonzept fuer Rechnungsausstellung ist zu locker

Status: `Teilweise erfuellt`

Es fehlt ein klarer produktiver Freigabepfad:

- wer darf Entwuerfe anlegen
- wer darf ausstellen
- wer darf stornieren
- wer darf archivieren

## 6. Bereiche, Die Bereits Gut Vorbereitet Sind

## 6.1 Snapshots

Positiv:

- Kunden-, Verkaeufer- und Projektdaten werden als Snapshot auf der Rechnung abgelegt
- das ist fuer spaetere Nachvollziehbarkeit fachlich sehr wichtig

## 6.2 Centbasierte Geldspeicherung

Positiv:

- Geldbetraege werden als Integer-Cents gespeichert
- das reduziert Rundungsprobleme und ist fuer Buchhaltungsnaehe sinnvoll

## 6.3 E-Rechnungsrichtung

Positiv:

- XRechnung/ZUGFeRD-Unterstuetzung ist im Code angelegt
- das ist eine gute Basis fuer Deutschland und oeffentliche Auftraggeber

## 6.4 Audit-Struktur

Positiv:

- getrennte Rechnungsaudit-Tabelle ist vorhanden
- Mahnlogik und Ereignisprotokollierung sind fachlich sinnvoll angelegt

## 7. Mindestmassnahmen Vor Einer Fachlichen Freigabe

Vor produktiver Freigabe sollte mindestens umgesetzt sein:

1. harter Compliance-Check vor `issue()`
2. manipulationsresistente Archivierungsstrategie mit Datei-Hash
3. sauberer Storno-/Gegenbeleg-Workflow
4. Absicherung gegen Query-Builder-Umgehung
5. dokumentierte Rollen- und Rechtefreigaben
6. Verfahrensdokumentation in freigegebener Fassung
7. Testfaelle fuer:
   - Pflichtangaben
   - Reverse Charge
   - Kleinunternehmer
   - Storno
   - Mahnung
   - Export
   - Wiederherstellung aus Archiv

## 8. Empfohlene Nachweisartefakte Fuer Spaetere Pruefungen

- technische Verfahrensdokumentation
- Rollen- und Rechtekonzept
- Freigabeprozess fuer Rechnungen
- Testprotokolle
- Exportnachweis fuer Prueferfaelle
- Backup-/Restore-Nachweis
- Archivierungsnachweis mit Dateihashes

## 9. Schlussbewertung

Das System ist fachlich gut vorbereitet, aber aktuell noch kein sicherer Kandidat fuer die Aussage:

`revisionssicher, GoBD-konform und vollstaendig richtlinienkonform fuer Deutschland und EU`

Der richtige Status heute ist:

`fortgeschritten vorbereitet, aber noch nicht belastbar abgeschlossen`
