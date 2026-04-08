# AGENTS.md

## Zweck

Diese Datei definiert die dauerhaften Arbeitsregeln fuer KI-Coding-Agenten in diesem Repository. Sie ergaenzt das bestehende `CLAUDE.md` und ist auf schnelle, stabile, produktionsreife Entwicklung ausgelegt.

Details und Begruendungen stehen in [docs/cli-ai-model-best-practices.de.md](./docs/cli-ai-model-best-practices.de.md) und [Workflow.md](./Workflow.md).

## Repository-Karte

- `backend/`: Laravel 12 API, Jobs, Auth, Billing, Reports, Admin
- `frontend/`: React 19 + TypeScript SPA
- `landing-page/`: statische Marketing-Seite
- `CLAUDE.md`: bestehender Projektkontext

## Nicht verhandelbare Regeln

- Arbeite standardmaessig in kleinen, verifizierbaren Schritten.
- Fuehre Aenderungen nicht als Single-Shot-Implementierung aus.
- Schreibe fuer Bugfixes zuerst einen Regressionstest oder mindestens einen reproduzierbaren fehlschlagenden Check.
- Schreibe fuer neue Features zuerst einen Akzeptanz-, API- oder Integrationscheck.
- Fuehre nach jeder relevanten Aenderung die passenden Tests und Checks aus.
- Schliesse keine Aufgabe ab, wenn das Ergebnis nicht gegen das Done-Kriterium validiert wurde.
- Nutze Sub-Agents nur fuer klar begrenzte, parallelisierbare Arbeit.
- Der Haupt-Agent bleibt fuer Integration, finale Diff-Pruefung und Abschluss verantwortlich.

## Repo-spezifische Risiken

- Multi-Tenancy ist kritisch. `tenant_id`-Isolation darf nie durchbrochen werden.
- Rollenlogik ist kritisch. `owner > manager > employee` muss bei allen geschuetzten Bereichen korrekt bleiben.
- Sanctum-Auth, Portal-Flows, Rechnungen, Mahnungen und Dateiverarbeitung sind regressionsanfaellig.
- Frontend-Texte muessen bei App-Aenderungen i18n-konform bleiben.
- Landingpage-Aenderungen duerfen Links, Rechtstexte und Formularfluesse nicht brechen.

## Bevor du Code aenderst

- Formuliere Ziel, betroffene Bereiche, Constraints und Done-Kriterium.
- Lies nur die wirklich relevanten Dateien und Commands ein.
- Plane bei mehr als einer Datei oder unklarem Scope zuerst kurz den Ablauf.
- Waehle die kleinstmoegliche testbare Einheit.

## Standardarbeitsweise

1. Problem reproduzieren.
2. Failing Test oder Repro-Check anlegen.
3. Kleinsten sinnvollen Fix implementieren.
4. Tests gruen bekommen.
5. Adversarial haerten.
6. Relevante Gates laufen lassen.
7. Diff auf Regressionen, Sicherheit und Scope pruefen.

## Adversarial-Standardcheck

Pruefe, soweit passend:

- leere, `null`, ungueltige oder unerwartete Eingaben
- Rollen- und Berechtigungsfehler
- falscher Tenant/Mandant
- Grenzwerte bei Geld, Datum, Uhrzeit und Rundung
- doppelte Requests und Idempotenz
- kaputte API-Antworten oder fehlende Felder
- grosse Datenmengen, Uploads oder Listen

## Quality Gates

### Backend

- `php artisan test` oder gezielte Tests fuer den geaenderten Bereich
- bei riskanten Aenderungen: Rollen-, Tenant- und Negativtests

### Frontend

- `npm run lint`
- `npm run build`
- bei Verhaltensaenderungen: relevante UI-/Flow-Validierung

### Landingpage

- Link- und Formularpruefung
- Pflichtseiten und Footer-Links pruefen
- keine kaputten Anker oder Script-Referenzen

## Sub-Agent-Regeln

Setze Sub-Agents nur ein fuer:

- Recherche in getrennten Modulen
- Testausfuehrung und Fehlerzusammenfassung
- Review von Security-, Permission- oder API-Themen
- CI-, Log- oder Dokumentations-Triage

Vermeide Sub-Agents wenn:

- mehrere Teilaufgaben dieselben Dateien schreiben
- staendige Rueckkopplung noetig ist
- die Aufgabe klein genug fuer einen direkten Durchlauf ist

## Fertig ist eine Aufgabe erst, wenn

- das angeforderte Verhalten sichtbar umgesetzt wurde
- passende Tests oder Repro-Checks vorliegen
- relevante Checks gruen sind
- der Diff manuell auf Nebenwirkungen geprueft wurde
- verbleibende Risiken offen benannt wurden

## Wichtige Kommandos

### Backend

- `composer test`
- `php artisan test --filter TestName`
- `./vendor/bin/pint`

### Frontend

- `npm run dev`
- `npm run lint`
- `npm run build`

### Datenbank

- `php artisan migrate`
- `php artisan db:seed`

## Verweise

- [CLAUDE.md](./CLAUDE.md)
- [Workflow.md](./Workflow.md)
- [docs/cli-ai-model-best-practices.de.md](./docs/cli-ai-model-best-practices.de.md)
