# Workflow.md

## Ziel

Dieser Workflow ist fuer schnelle, stabile Entwicklung mit CLI-Terminal-AI-Modellen gedacht. Er priorisiert:

- kurze Iterationen
- fruehe Verifikation
- adversariales Testen
- harte Quality Gates
- klare Rollen fuer Haupt-Agent und Sub-Agents

## Die drei Arbeitsmodi

### Modus A: Kleine, risikoarme Aenderung

Nutzen fuer:

- Textkorrekturen
- kleine UI-Fixes
- klar begrenzte Styles oder statische Seiten

Minimum:

1. Scope bestaetigen
2. gezielten Check oder Sichtpruefung definieren
3. kleinen Fix umsetzen
4. relevanten Check laufen lassen
5. Diff kurz reviewen

### Modus B: Normale Feature- oder Bugfix-Aenderung

Standardmodus fuer:

- Backend-Endpoints
- Frontend-Flows
- Datenmapping
- Formulare
- Rollen- oder Portalverhalten

Pflichtablauf:

1. Reproduzieren
2. Failing Test oder Repro-Check
3. kleinster Fix
4. Test gruen
5. adversarial haerten
6. Gates laufen lassen
7. Diff reviewen

### Modus C: Produktionskritische oder riskante Aenderung

Nutzen fuer:

- Auth
- Mandantentrennung
- Rollen und Rechte
- Rechnungen, Mahnungen, DATEV, ZUGFeRD
- Dateien, Uploads, Exporte
- Migrations und Datenfluss

Zusatzpflichten:

- Negativtests
- Endzustandspruefung
- Rollback-/Fehlerfall mitdenken
- Observability oder klare Risikodokumentation

## Phase 1: Intake und Scope

Vor jeder Aenderung beantworten:

- Was ist das Ziel?
- Welche Dateien oder Module sind wahrscheinlich betroffen?
- Welche Regeln duerfen nicht verletzt werden?
- Woran erkennen wir "fertig"?

Ausgabe der Phase:

- ein klares Done-Kriterium
- eine erste Testidee
- ein enger Scope

## Phase 2: Red

Erzeuge zuerst eine fehlschlagende Spezifikation.

Bevorzugte Reihenfolge:

1. Regressionstest fuer Bugfix
2. Akzeptanztest fuer Feature
3. Integrations- oder Vertragstest fuer API-Verhalten
4. klarer manueller Repro-Check, wenn Automatisierung unverhaeltnismaessig ist

Regeln:

- Der Test muss klein und aussagekraeftig sein.
- Der Test muss den relevanten Fehler wirklich treffen.
- Kein breiter Testteppich ohne klaren Bezug zur Aenderung.

## Phase 3: Green

Implementiere nur den kleinsten sinnvollen Fix.

Regeln:

- keine opportunistischen Nebenrefactors
- keine Architektur-Umbauten ohne separaten Anlass
- zuerst Verhalten stabilisieren, dann schoener machen

Wenn die Aenderung groesser wird als erwartet:

- abbrechen
- Scope neu schneiden
- weiteren failing Test definieren

## Phase 4: Refactor

Erst wenn der Test gruen ist:

- Duplikate reduzieren
- Namen schaerfen
- Helfer extrahieren
- tote Pfade entfernen

Refactor nie ohne erneute Verifikation.

## Phase 5: Adversarial Hardening

Hier wird aus "funktioniert bei mir" eine belastbare Aenderung.

### Allgemeine Gegenprobe

Pruefe mindestens die passenden Punkte:

- leerer Input
- `null`/fehlende Werte
- falsches Format
- unautorisierter Zugriff
- falscher Tenant
- falsche Rolle
- doppelte Aktion
- grosse Datenmengen
- Zeit-, Datums- oder Rundungsrandfaelle
- unvollstaendige externe Antworten

### Repo-spezifische Gegenprobe

#### Backend

- Tenant-Filter greift weiterhin
- Rolle wird serverseitig erzwungen
- API gibt im Fehlerfall sinnvolle Statuscodes
- Finanz- und Rechnungslogik bleibt konsistent

#### Frontend

- Loading-, Error- und Empty-State brechen nicht
- API-Fehler fuehren nicht zu stillem Datenverlust
- i18n bleibt intakt
- Build bleibt sauber

#### Landingpage

- Navigation funktioniert
- Formulare und CTA-Links funktionieren
- Footer und Pflichtseiten sind erreichbar
- keine kaputten Referenzen oder IDs

## Phase 6: Quality Gates

### Minimal Gate

- passende Tests oder Repro-Checks vorhanden
- relevanter Testlauf erfolgreich
- Diff manuell geprueft

### Standard Gate

- Backend: `composer test` oder gezielte `php artisan test`-Suite
- Frontend: `npm run lint` und `npm run build`
- Dokumentation aktualisiert, wenn Verhalten oder Commands sich aendern

### Starkes Gate fuer produktionsnahe Aenderungen

- Negativtests fuer Rollen und Tenant
- Smoke-Test des Hauptflows
- Migrations- und Datenrisiken geprueft
- Rest-Risiko explizit benannt

## Phase 7: Diff-Review

Vor Abschluss immer:

- ist der Scope enger geblieben als geplant?
- gibt es Seiteneffekte?
- wurde versehentlich unnoetiger Code mitgezogen?
- ist die Loesung zu kompliziert fuer das Problem?
- fehlen Tests fuer offensichtliche Gegenfaelle?

## Sub-Agent-Workflow

## Hauptregel

Der Haupt-Agent plant, integriert und finalisiert. Sub-Agents liefern Input, keine unkontrollierte Gesamtloesung.

### Gute Rollen

- `research`: untersucht Codepfade, Docs oder Logs
- `test-runner`: fuehrt Tests aus und verdichtet Fehler
- `reviewer`: sucht Risiken, Regressionen und Security-Probleme
- `docs`: aktualisiert Dokumentation nach einer bestaetigten Aenderung

### Gute Delegationsfaelle

- getrennte Recherche in Backend und Frontend
- parallele Analyse mehrerer Module
- Tests erzeugen viel Output, aber nur die Zusammenfassung ist wichtig
- ein separater Review-Blick soll die Hauptloesung challengen

### Schlechte Delegationsfaelle

- zwei Agents schreiben dieselben Dateien
- staendiges Ping-Pong zwischen Implementierung und Testlogik
- enge fachliche Koppelung ohne klare Schnittstelle

### Delegationsregeln

- jede delegierte Aufgabe hat klaren Scope
- jede delegierte Aufgabe hat klares Ergebnisformat
- moeglichst getrennte Dateibesitzbereiche
- Haupt-Agent uebernimmt das Endreview

## Handoff-Standard

Jeder Abschluss sollte knapp beantworten:

- Was wurde geaendert?
- Woran wurde es verifiziert?
- Welche Risiken bleiben?
- Welche naechste sinnvolle Aktion gibt es, falls relevant?

## Default-Checkliste fuer dieses Repository

### Backend-Aenderung

1. Repro oder Test definieren
2. kleinsten Fix bauen
3. `php artisan test` fuer den betroffenen Bereich
4. Rollen- und Tenant-Gegenprobe
5. Finanz-/Datenintegritaet pruefen, falls relevant

### Frontend-Aenderung

1. sichtbares Verhalten definieren
2. kleinsten UI- oder State-Fix bauen
3. `npm run lint`
4. `npm run build`
5. Error-/Loading-/Empty-State pruefen

### Landingpage-Aenderung

1. sichtbare Aussage oder Linkziel definieren
2. kleinen HTML/CSS/JS-Fix bauen
3. Link- und Anchor-Pruefung
4. Pflichtseiten pruefen
5. Formular- und CTA-Fluss pruefen

## Abschlussregel

Schnell ist nur dann schnell, wenn wir denselben Bereich nicht in zwei Tagen erneut anfassen muessen. Deshalb gilt:

- lieber ein kleiner sauber verifizierter Schritt
- als ein grosser beeindruckender, aber fragiler Agentenlauf
