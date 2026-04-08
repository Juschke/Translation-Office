# Evidenzbasierte Best Practices fuer die Entwicklung mit CLI-Terminal-AI-Modellen

## Zweck

Dieses Dokument beschreibt eine belastbare Arbeitsweise fuer die Entwicklung von Anwendungen mit terminalbasierten KI-Coding-Agenten. Der Fokus liegt auf vier Hebeln:

- testgetriebene Entwicklung
- adversariales Testen
- Sub-Agent- und Workflow-Automatisierung
- Quality Gates fuer stabile, produktionsreife Releases

Die Empfehlungen hier sind absichtlich praktisch formuliert. Sie sollen direkt in `AGENTS.md` und `Workflow.md` uebersetzbar sein.

## Kurzfazit

- CLI-AI-Modelle sind starke Beschleuniger, aber keine verlaesslichen Single-Shot-Programmierer.
- Die groessten Qualitaetsgewinne kommen nicht aus laengeren Prompts, sondern aus kleinen, testbaren Iterationen mit klaren Done-Kriterien.
- Fuer echte Stabilitaet braucht man mehr als Unit-Tests: negative Tests, Rollen- und Mandanten-Checks, Property-/Invariantentests, Diff-Review und reproduzierbare Gates.
- Sub-Agents helfen, wenn Arbeit parallelisierbar und sauber begrenzbar ist. Sie verschlechtern Ergebnisse, wenn Koordination wichtiger ist als Parallelitaet.
- Die schnellste stabile Arbeitsweise ist: kleine Schritte, frueh ausfuehrbare Tests, aggressive Gegenbeispiele, harte Gates vor Abschluss.

## Was die Evidenz zeigt

| Thema | Primaerquelle | Befund | Praktische Ableitung |
|---|---|---|---|
| Reale Softwareprobleme sind schwer | [SWE-bench, Jimenez et al., 2023/2024](https://arxiv.org/abs/2310.06770) | SWE-bench zeigt, dass reale GitHub-Issues deutlich komplexer sind als klassische Codegen-Aufgaben. In der urspruenglichen Evaluation loeste das beste Modell nur `1.96%` der Aufgaben. | Kein Vertrauen in Single-Pass-Code. Immer mit Tests, Review und Endzustandspruefung arbeiten. |
| Kleine, gleichmaessige TDD-Zyklen sind entscheidend | [Fucci et al., 2016](https://arxiv.org/abs/1611.05994) | Qualitaet und Produktivitaet waren vor allem mit feingranularen und gleichmaessigen Schritten verbunden, nicht primaer mit der reinen Reihenfolge "Test zuerst" vs. "Test zuletzt". | TDD pragmatisch umsetzen: klein, stetig, ausfuehrbar. Nicht dogmatisch, aber immer mit frueher ausfuehrbarer Spezifikation. |
| Test-Designer + Test-Ausfuehrung + Iteration verbessern Codegen | [AgentCoder, Huang et al., 2024](https://arxiv.org/abs/2312.13010) | Ein spezialisiertes Multi-Agent-Setup mit Programmierer-, Test-Designer- und Test-Executor-Agent verbesserte `pass@1` deutlich gegenueber Vergleichsansaetzen. | Testen ist kein Nachsatz. Test-Design und Test-Ausfuehrung muessen Teil des Agenten-Workflows sein. |
| Property-based Testing findet reale Bugs, die Beispieltests uebersehen | [Anthropic Red Team, 14. Januar 2026](https://red.anthropic.com/2026/property-based-testing/) | Claude-basierte Agenten fanden in grossen Python-Projekten reale Bugs; bei top-gerankten Reports waren `86%` valide und `81%` valide plus reportierbar. | Neben Beispieltests immer Invarianten, Randbereiche und generative Gegenbeispiele testen. |
| Evals werden nach der Prototyping-Phase unverzichtbar | [Anthropic, Demystifying evals for AI agents, 2026](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Ohne Evals fliegen Teams laut Anthropic "blind", Regressionen werden dann nur noch reaktiv ueber Nutzerbeschwerden entdeckt. | Quality Gates muessen automatisiert, wiederholbar und outcome-basiert sein. |
| Durable Guidance und Skills erhoehen Konsistenz | [OpenAI Codex Best Practices, 2026](https://developers.openai.com/codex/learn/best-practices/) | OpenAI empfiehlt `AGENTS.md` fuer dauerhafte Regeln, Skills fuer wiederholbare Jobs und stabile Automationen erst nach manueller Reife. | Regeln aus Prompts in Dateien ueberfuehren. Wiederkehrende Prozesse nicht jedes Mal neu prompten. |
| Sub-Agents helfen vor allem bei paralleler, abgegrenzter Arbeit | [Anthropic, Multi-Agent Research System, 13. Juni 2025](https://www.anthropic.com/engineering/multi-agent-research-system) und [OpenAI Codex Best Practices, 2026](https://developers.openai.com/codex/learn/best-practices/) | Anthropic berichtet `+90.2%` auf einer internen Research-Eval fuer stark parallelisierbare Aufgaben, warnt aber zugleich, dass viele Coding-Aufgaben nur begrenzt parallelisierbar sind und Koordination kostet. | Sub-Agents nur fuer klar begrenzte, nicht stark gekoppelte Teilaufgaben einsetzen. Haupt-Agent behaelt Integration und Endverantwortung. |

## Zentrale Prinzipien

### 1. AI als beschleunigter Teamkollege, nicht als Autopilot

Die wichtigste Lehre aus SWE-bench, AgentCoder, Anthropic Evals und den Codex-Dokumenten ist dieselbe: Die Qualitaet steigt nicht dadurch, dass man dem Modell "mehr vertraut", sondern dadurch, dass man dem Modell einen guten Arbeitsrahmen gibt.

Ableitung aus den Quellen:

- Ziel, Kontext, Constraints und Done-Kriterien muessen explizit sein.
- Das Modell sollte moeglichst frueh sehen koennen, woran Erfolg gemessen wird.
- Jeder groessere Schritt braucht eine ausfuehrbare Rueckmeldung: Test, Build, Lint, Typcheck, Diff-Review oder Eval.

### 2. TDD fuer CLI-AI-Modelle: pragmatisch, klein, ausfuehrbar

Die Evidenz stuetzt kein religioeses "immer Test vor jeder einzelnen Zeile Code", wohl aber klar:

- kleine Zyklen
- gleichmaessige Schritte
- fruehe ausfuehrbare Spezifikation
- saubere Rueckkopplung

Empfohlene Standardform:

1. Verhalten oder Bug knapp beschreiben.
2. Einen fehlschlagenden Test, Repro-Case oder Akzeptanzcheck anlegen.
3. Nur die kleinste notwendige Implementierung aendern.
4. Test gruen bekommen.
5. Refactoren.
6. Danach adversarial haerten.

Praxisregel:

- Bugfix: zuerst Regressionstest.
- Neues Feature: zuerst Akzeptanz- oder API-Vertragstest.
- Refactor ohne Verhaltensaenderung: bestaetigende Tests zuerst oder vorhandene Tests erweitern.
- Nur wenn ein Test unverhaeltnismaessig teuer ist, darf ersatzweise eine klare manuelle oder skriptbare Reproduktionsroutine als temporaere Spezifikation dienen.

### 3. Adversariales Testen als Standard, nicht als Sonderfall

Beispieltests decken Gluecksfaelle ab. Produktionsfehler leben in Gegenbeispielen.

Das Anthropic-Property-based-Testing-Ergebnis stuetzt stark, dass KI-gestuetzte Testarbeit besonders gut darin ist, Invarianten und Randbedingungen aus Kontext abzuleiten. Daraus folgt:

- Schreibe nicht nur "Happy Path"-Tests.
- Lass den Agenten explizit nach Gegenbeispielen suchen.
- Nutze Invarianten, keine reine Beispielsammlung.

Empfohlene adversariale Testmatrix:

- ungueltige Eingaben
- leere oder `null`/`undefined`-Werte
- extrem grosse oder extrem kleine Werte
- doppelte Requests und Idempotenz
- Rollen- und Berechtigungsfehler
- falscher Tenant/Mandant
- Grenzwerte bei Datum, Waehrung, Rundung und Zeitzonen
- konkurrierende Updates
- kaputte oder unvollstaendige API-Antworten
- Encoding-, Upload- und Dateiformatfehler
- Invarianten wie "serialisieren und wieder lesen ergibt aehnliche Semantik"

Fuer dieses Repository sind besonders wichtig:

- Mandantentrennung
- Rollenmodell `owner > manager > employee`
- API- und Frontend-Vertragskonsistenz
- Rechnungs- und Finanzlogik
- Dateiupload und Dokumentenpfade

### 4. Sub-Agent-Workflows: nur fuer bounded work

Die Quellen zeigen ein klares Muster:

- Multi-Agent-Setups koennen stark helfen.
- Der Nutzen haengt stark von Parallelisierbarkeit und sauberer Aufgabentrennung ab.
- Koordinationskosten, Tokenkosten und Kontextverlust sind real.

Deshalb sollte ein Coding-Workflow einen Orchestrator-Worker-Ansatz nur dann nutzen, wenn die Teilaufgaben:

- fachlich klar trennbar sind
- wenig Rueckkopplung brauchen
- unterschiedlichen Toolzugriff brauchen
- am Ende in eine kleine, synthetisierte Rueckmeldung verdichtet werden koennen

Gute Sub-Agent-Aufgaben:

- Codebase-Recherche in getrennten Modulen
- Testlauf und Fehlerzusammenfassung
- Security-/Permission-Review
- API-Dokumentationsabgleich
- Log- oder CI-Triage

Schlechte Sub-Agent-Aufgaben:

- stark gekoppelte Refactors auf denselben Dateien
- UI- und Backend-Implementierung mit staendigen Rueckfragen
- spontane Parallelisierung ohne klare Dateibesitzgrenzen

### 5. Quality Gates muessen outcome-basiert sein

Anthropic beschreibt fuer Agent-Evals einen wichtigen Punkt: Nicht der exakte Weg ist entscheidend, sondern ob der richtige Endzustand erreicht wurde. Das ist fuer App-Entwicklung besonders nuetzlich.

Ein wirksamer Quality Gate ist deshalb kein einzelner Test, sondern eine Schichtenlogik:

- Code aendert das gewuenschte Verhalten
- relevante Tests bestehen
- negative/adversariale Tests decken typische Fehlannahmen ab
- Lint/Build/Typcheck bestehen
- Diff ist gegen Regressionen geprueft
- bei riskanten Aenderungen ist ein Endzustand oder Smoke-Test bestaetigt

Empfohlene Minimal-Gates:

- passende Regression oder Akzeptanzpruefung vorhanden
- relevante Unit-/Feature-/Integrationstests gruen
- `npm run build` und `npm run lint` fuer Frontend-Aenderungen
- `php artisan test` bzw. gezielte Laravel-Tests fuer Backend-Aenderungen
- manuelle Diff-Pruefung fuer Nebenwirkungen

Empfohlene starke Gates fuer produktionsnahe Aenderungen:

- Rollen- und Tenant-Negativtests
- Migrations- oder Datenflusspruefung
- Logging/Observability bei riskanten Aenderungen
- API-Vertragspruefung und Frontend-Rueckwaertskompatibilitaet
- Smoke-Test des betroffenen Hauptflows

## Empfohlene Default-Arbeitsweise fuer dieses Repository

### Standardzyklus

1. Problem reproduzieren und Done-Kriterium notieren.
2. Kleinstmoeglichen fehlschlagenden Test oder Repro-Fall anlegen.
3. Kleinsten Fix implementieren.
4. Relevante Tests gruen bekommen.
5. Adversarial haerten.
6. Lint, Build, Typcheck und/oder API-Tests laufen lassen.
7. Diff reviewen: Sicherheit, Mandantentrennung, Rollen, Datenintegritaet.
8. Erst dann als "fertig" markieren.

### Wann Sub-Agents sinnvoll sind

- Wenn Frontend, Backend und Landingpage getrennt recherchiert werden koennen
- Wenn ein Agent nur Tests oder nur Logs auswerten soll
- Wenn eine Review-Perspektive bewusst getrennt werden soll, z. B. Security vs. Produktverhalten

### Wann keine Sub-Agents

- Wenn mehrere Teilaufgaben dieselben Dateien schreiben
- Wenn die richtige Loesung staendig von Zwischenergebnissen anderer Teilaufgaben abhaengt
- Wenn der Aufwand fuer Koordination hoeher waere als die eigentliche Implementierung

## Konkrete Regeln fuer stabile, schnelle Liefergeschwindigkeit

- Lieber 3 kleine PR-faehe Schritte als 1 grosse und schwer pruefbare Aenderung.
- Kein Code ohne verifizierbares Done-Kriterium.
- Kein Bugfix ohne Regressionstest, ausser ein Test ist technisch unverhaeltnismaessig und der Grund ist dokumentiert.
- Kein "passt schon" bei Rollen-, Auth-, Tenant- oder Finanzlogik.
- Kein produktionsnaher Abschluss ohne harte Gates.
- Wiederkehrende Prompts in Skills, nicht in Chat-Verlaeufe.
- Automatisierungen erst dann planen, wenn der manuelle Ablauf zweimal stabil funktioniert hat.

## Quellen

1. OpenAI, "Best practices", Codex-Dokumentation, abgerufen am 7. April 2026:
   [https://developers.openai.com/codex/learn/best-practices/](https://developers.openai.com/codex/learn/best-practices/)
2. OpenAI, "Generate AGENTS.md with /init", Codex CLI-Dokumentation, abgerufen am 7. April 2026:
   [https://developers.openai.com/codex/cli/slash-commands/](https://developers.openai.com/codex/cli/slash-commands/)
3. Carlos E. Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?", arXiv:2310.06770:
   [https://arxiv.org/abs/2310.06770](https://arxiv.org/abs/2310.06770)
4. Davide Fucci et al., "A Dissection of the Test-Driven Development Process", arXiv:1611.05994:
   [https://arxiv.org/abs/1611.05994](https://arxiv.org/abs/1611.05994)
5. Dong Huang et al., "AgentCoder: Multi-Agent-based Code Generation with Iterative Testing and Optimisation", arXiv:2312.13010:
   [https://arxiv.org/abs/2312.13010](https://arxiv.org/abs/2312.13010)
6. Anthropic, "How we built our multi-agent research system", 13. Juni 2025:
   [https://www.anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)
7. Anthropic, "Demystifying evals for AI agents", 2026:
   [https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
8. Anthropic Red Team, "Finding bugs across the Python ecosystem with Claude and property-based testing", 14. Januar 2026:
   [https://red.anthropic.com/2026/property-based-testing/](https://red.anthropic.com/2026/property-based-testing/)
9. Anthropic Claude Code Docs, "Subagents" und "Common workflows", abgerufen am 7. April 2026:
   [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)
   [https://code.claude.com/docs/en/common-workflows](https://code.claude.com/docs/en/common-workflows)
