# Working Rules

## 1. Zweck

Dieses Dokument definiert Regeln fuer die taegliche Arbeit am Frontend. Es soll Abstimmungskosten senken, visuelle Drift verhindern und sicherstellen, dass neue Arbeit in das bestehende Produkt passt.

Es gilt fuer:

- Entwicklung
- UI/UX-Design
- Refactoring
- QA
- Produktabnahme

## 2. Grundsatz

Jede neue Aenderung muss gleichzeitig vier Dinge respektieren:

- Fachlogik
- Rollenlogik
- Corporate Design
- Arbeitsdichte des Produkts

## 3. Reihenfolge beim Bauen neuer UI

Wenn eine neue Oberflaeche entsteht, ist die Reihenfolge:

1. fachliche Aufgabe klaeren
2. existierenden Seitentyp identifizieren
3. vorhandene Komponenten wiederverwenden
4. Text und Zustandslogik definieren
5. erst dann neue Sonderkomponenten bauen

## 4. Wiederverwendungsregel

Vor dem Bau neuer UI gilt diese Reihenfolge:

1. `src/components/ui`
2. `src/components/common`
3. bereichsspezifische Komponenten im passenden Modul
4. neue Komponente nur bei echter Luecke

Nie sofort neue Grundkomponenten anlegen, wenn die bestehende Bausteinwelt den Zweck bereits erfuellt.

## 5. Visuelle Pflichtregeln

- Brand Primary bleibt die fuehrende Aktionsfarbe.
- Listen und Tabellen bleiben kompakt.
- Status wird immer textlich sichtbar gemacht.
- Primaeraktionen stehen im Seitenkopf oder klar im Kontext.
- datenlastige Bereiche duerfen nicht in lockere Marketing-Layouts umgebaut werden.
- Dropdowns, Filter und Exportpfade sollen sich visuell wie bestehende Arbeitswerkzeuge anfuehlen.

## 6. Seitenbaukasten

### Standard fuer Uebersichtsseiten

- Header
- Subline
- Primaeraktion
- KPI-Zeile
- Inhaltsbloecke

### Standard fuer Arbeitslisten

- Header mit Add-Action
- KPI-Zeile optional
- DataTable
- Filter, Suche, Export
- Bulk-Actions bei Selektion

### Standard fuer Detailseiten

- Objektkopf
- schnelle Kontextaktionen
- Tabs
- tiefe Fachbereiche

## 7. Text- und Benennungsregeln

- Buttontexte sind Verben oder klare Objekte
- Tabnamen beschreiben Arbeitsinhalt, nicht Technik
- Empty States bleiben hilfreich und knapp
- Fehlermeldungen sagen, was schiefging und was der Nutzer tun kann
- Badge-Texte und Statuslabels muessen fachlich konsistent bleiben

## 8. i18n-Regeln

- neue sichtbare Texte nicht hart in Komponenten verteilen, wenn sie produktweit relevant sind
- deutsch ist Primaersprache, englisch muss mitgedacht werden
- Label, Tooltip, leere Zustaende und Fehler sind Teil des Uebersetzungsumfangs
- Zahlen, Daten und Waehrungen immer lokalisiert darstellen

## 9. Daten- und Zustandsregeln

- Server-Daten immer ueber Query-Layer
- Mutationen liefern klares Feedback
- Loading, Empty, Error und Success muessen sichtbar modelliert werden
- Optimistische Updates nur dort einsetzen, wo der Rueckfall sauber handhabbar ist
- Polling und Realtime duerfen die UI nicht hektisch machen

## 10. Rollen- und Mandantenregeln

- keine neue Funktion ohne Rollenpruefung
- keine Annahme, dass Manager- oder Owner-Daten fuer alle sichtbar sind
- Multi-Tenant-Kontext muss in jeder fachlichen Erweiterung mitgedacht werden
- sensible Finance- und Teamfunktionen nie ungeschuetzt in Uebersichten leaken

## 11. Formregeln

- Labels ueber dem Feld
- Pflichtfelder klar
- Validierung frueh, aber nicht aggressiv
- komplexe Formulare in logische Abschnitte gliedern
- Formmodals nur fuer schnelle Bearbeitung, nicht fuer ganze Workflows missbrauchen

## 12. Tabellenregeln

- Tabellen sind Arbeitsflaechen
- Suchfeld ist Standard, wenn Datensatzmengen wachsen koennen
- Filter brauchen Reset
- Aktionsspalten bleiben rechts und knapp
- Bulk-Actions nur fuer fachlich sinnvolle Sammelvorgaenge
- keine visuelle Ueberladung pro Zeile

## 13. KPI-Regeln

- KPIs nur zeigen, wenn sie zu einer Entscheidung fuehren
- maximal vier pro Standardreihe
- Werte muessen fachlich interpretierbar sein
- Trends nur dann zeigen, wenn Datengrundlage stabil ist

## 14. Modal-Regeln

- bestaetigende Modals kurz halten
- Formmodals mit klarer Titelzeile
- schwerwiegende Aktionen explizit benennen
- keine verschachtelten Modal-Ketten, wenn ein Seitenkontext sauberer waere

## 15. Responsive Regeln

- Desktop zuerst denken, Mobile nie ignorieren
- Buttonlabels auf kleinen Screens aktiv kuerzen
- Split Views brauchen einen sinnvollen Fallback
- sehr breite Tabellen brauchen eine kontrollierte Scrollstrategie
- keine unbedachten festen Hoehen ohne Mobile-Check

## 16. Accessibility-Checkliste

Vor Fertigstellung einer UI-Aenderung pruefen:

- ist der Fokus sichtbar
- sind Icon-Buttons beschriftet
- ist Status nicht nur farblich erkennbar
- sind kleine Texte noch lesbar
- funktionieren wichtige Aktionen per Tastatur

## 17. Definition of Done fuer Frontend-Arbeit

Eine Frontend-Aenderung ist erst fertig, wenn:

- der fachliche Flow funktioniert
- Rollen- und Sichtbarkeitslogik stimmt
- Loading, Empty und Error States vorhanden sind
- Design zum bestehenden Produkt passt
- Texte in der richtigen Sprache und Tonalitaet vorliegen
- Desktop und Mobile mindestens grob validiert wurden
- keine neue visuelle Sonderlogik ohne Begruendung eingebaut wurde

## 18. Review-Fokus

Bei Review und Abnahme sollen diese Fragen zuerst beantwortet werden:

- passt die Funktion in den fachlichen Kontext
- fuehlt sich die UI wie Translator Office an
- ist die primaere Aktion klar
- ist die Seite fuer Tagesarbeit schnell genug erfassbar
- wurden bestehende Muster wiederverwendet
- entstehen Inkonsistenzen in Tabellen, Buttons, Filtern oder Statusdarstellung

## 19. Empfohlene naechste Doku-Ausbaustufen

Als naechste sinnvolle Schritte fuer das Team bieten sich an:

- screenshot-basierte Pattern Library
- Figma-Datei oder Token-Tabelle als gestalterische Quelle
- fachliche Prozessdoku pro Kernflow
- QA-Testskripte pro Rolle
- Uebersetzungsguide fuer deutsch und englisch

## 20. Arbeitsprinzip in einem Satz

Nicht neue Oberflaechen erfinden, sondern das bestehende Produkt bewusst weiterbauen: fachlich klar, visuell konsequent, rollenbewusst und auf produktive Tagesarbeit ausgerichtet.
