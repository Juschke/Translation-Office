# UX Optimization: Projects Roadmap

## 1. Ziel

Dieses Dokument uebersetzt die Empfehlungen aus [UX-OPTIMIZATION-PROJECTS.md](C:\xampp\htdocs\Translation-Office\frontend\docs\UX-OPTIMIZATION-PROJECTS.md) in eine konkrete Reihenfolge fuer die Umsetzung.

Der Fokus liegt auf:

- hoher Wirkung bei geringer Designveraenderung
- klarer Priorisierung
- wenig Risiko fuer bestehende Nutzer
- konsistenter Weiterentwicklung des vorhandenen UI-Stils

## 2. Umsetzungsprinzip

Die Reihenfolge ist bewusst so gebaut:

1. erst Informationshierarchie verbessern
2. dann Klickwege verkuerzen
3. dann Layouts verdichten
4. erst danach tiefere Interaktionsmuster wie Inline-Editing ausbauen

So bleibt das Produkt fuer bestehende Nutzer wiedererkennbar und gewinnt trotzdem spuerbar an Tempo.

## 3. Quick Wins

Diese Punkte koennen mit relativ geringem Risiko und ohne kompletten Umbau viel bringen.

### QW-1: Vordefinierte Arbeitsansichten in der Projektliste

**Nutzen:** sehr hoch  
**Aufwand:** niedrig bis mittel  
**Risiko:** niedrig

Empfohlene Presets:

- Meine offenen Projekte
- Heute faellig
- Ueberfaellig
- Ohne Partner
- Express
- Zur Rechnung bereit

Warum zuerst:

- spart sofort Klicks
- macht die Liste arbeitsorientierter
- veraendert das Corporate Design praktisch nicht

### QW-2: Standardspalten in der Projektliste reduzieren

**Nutzen:** hoch  
**Aufwand:** niedrig  
**Risiko:** niedrig

Standard sichtbar:

- Projekt
- Kunde
- Sprachpaar
- Status
- Deadline
- Partner
- Preis oder Marge

Standard ausblendbar:

- lange Kontakt- und Adressdetails
- tiefere Zahlungsdetails
- selten genutzte Meta-Spalten

### QW-3: Sticky Toolbar in der Projektliste

**Nutzen:** hoch  
**Aufwand:** niedrig bis mittel  
**Risiko:** niedrig

Sticky bleiben sollen:

- Suche
- Preset / Filterkontext
- Filterbutton
- Export
- Spaltenbutton

### QW-4: Sticky Summary-Bar im Projektdetail

**Nutzen:** sehr hoch  
**Aufwand:** mittel  
**Risiko:** niedrig bis mittel

Inhalt:

- Projektnummer
- Projektname
- Sprachpaar
- Status
- Deadline
- Kunde
- Partner
- offene Zahlung oder Marge

Aktionen:

- Bearbeiten
- Datei hochladen
- E-Mail
- Rechnung

### QW-5: Overview-Tab zusammenkuerzen

**Nutzen:** hoch  
**Aufwand:** mittel  
**Risiko:** niedrig

Sichtbar im Erstzustand:

- Basisdaten
- Kunde kompakt
- Partner kompakt
- Dokumentenstatus
- Rechnungsstatus

Sekundaer:

- volle Adressen
- Zusatzkontakte
- Detailmetadaten

### QW-6: Tabs im Projektdetail sticky machen

**Nutzen:** hoch  
**Aufwand:** niedrig bis mittel  
**Risiko:** niedrig

Nutzen:

- weniger Rueckscrollen
- schnellere Wechsel zwischen Dateien, Finanzen, Kommunikation

## 4. High Impact / Low Effort

Die beste Startreihenfolge fuer direkte Wirkung:

1. Preset-Arbeitsansichten in der Projektliste
2. Standardspalten reduzieren
3. Sticky Toolbar in der Projektliste
4. Sticky Tabs im Projektdetail
5. Overview-Tab straffen

Diese Kombination bringt den groessten Effekt auf:

- Tagesstart
- Suchzeit
- Scrolltiefe
- mentale Last

## 5. High Impact / Medium Effort

Diese Punkte sind sehr wertvoll, brauchen aber sauberere Detailarbeit:

1. sticky Summary-Bar im Projektdetail
2. Spalte oder Kennzeichnung "naechste Aktion" in der Projektliste
3. kompaktere Kommunikationsansicht im Projekt
4. Finanzbereich staerker nach Entscheidungslogik ordnen

## 6. Mittelfristige Ausbaustufe

Diese Punkte sind sinnvoll, sollten aber nach den Quick Wins kommen:

- Inline-Aenderung fuer Status
- Inline-Aenderung fuer Partner
- Inline-Aenderung fuer Deadline
- persoenlich gespeicherte Listenansichten
- rechte Schnellvorschau aus der Projektliste

## 7. Konkrete Layout-Skizze: Projektliste

## 7.1 Soll-Struktur

```text
+----------------------------------------------------------------------------------+
| Projekte                                            [Neu]                        |
| Kurzbeschreibung / Kontext                                                     |
+----------------------------------------------------------------------------------+
| KPI 1 | KPI 2 | KPI 3 | KPI 4                                                   |
+----------------------------------------------------------------------------------+
| Presets: [Meine] [Heute] [Ueberfaellig] [Ohne Partner] [Express] [Rechnung]    |
+----------------------------------------------------------------------------------+
| Suche | Filter | Export | Spalten | Ansichtsmodus Liste/Kanban                 |
+----------------------------------------------------------------------------------+
| Tabelle                                                                         |
| Projekt | Kunde | Sprachpaar | Status | Deadline | Partner | Wert | Aktion      |
| ...                                                                             |
+----------------------------------------------------------------------------------+
| Pagination / Anzahl / Auswahlmodus                                              |
+----------------------------------------------------------------------------------+
```

## 7.2 Empfohlene Informationsreihenfolge pro Zeile

### Projekt

Zeigen:

- Projektnummer
- Projektname

Nicht standardmaessig in derselben Zelle:

- zu viele Zusatzmetaangaben

### Kunde

Zeigen:

- Name
- optional eine einzige Zusatzzeile, wenn relevant

Nicht standardmaessig:

- komplette Adresse
- mehrere Kontaktkanaele

### Sprachpaar

Beibehalten:

- Flaggen
- Kurzbezeichnung

### Status

Beibehalten:

- Badge

Erweitern:

- wenn noetig kleine Zweitinformationslogik wie `wartet auf Partner`

### Deadline

Zeigen:

- Datum
- Dringlichkeitslabel

### Partner

Zeigen:

- Name oder `nicht zugewiesen`

Nicht standardmaessig:

- komplette E-Mail

### Wert

Je nach Fokus:

- Gesamtpreis oder Marge

Nicht beides gleichzeitig im Erstzustand, wenn Platz knapp ist.

### Aktion

Kurz und eindeutig:

- Partner zuweisen
- Rechnung erstellen
- E-Mail
- Dateien

## 7.3 Was auf Mobil anders sein sollte

- KPI-Zeile umbrechen
- Presets horizontal scrollbar
- Tabelle auf Kernspalten reduzieren
- Sekundaeraktionen hinter Menue

## 8. Konkrete Layout-Skizze: Projektdetail

## 8.1 Soll-Struktur

```text
+----------------------------------------------------------------------------------+
| Zurueck | Projektname / Projektnummer                     [Aktionen-Menue]       |
+----------------------------------------------------------------------------------+
| Sticky Summary Bar                                                               |
| Status | Deadline | Sprachpaar | Kunde | Partner | Marge/Offen | Schnellaktionen |
+----------------------------------------------------------------------------------+
| Sticky Tabs: [Stammdaten] [Dateien] [Finanzen] [Kommunikation] [Historie]       |
+----------------------------------------------------------------------------------+
| Aktiver Tab-Inhalt                                                               |
|                                                                                  |
| Bereich 1                                                                        |
| Bereich 2                                                                        |
| Bereich 3                                                                        |
+----------------------------------------------------------------------------------+
```

## 8.2 Inhalt der Summary-Bar

### Linke Seite

- Projektnummer
- Projektname
- Status
- Deadline

### Mitte

- Sprachpaar
- Kunde
- Partner

### Rechte Seite

- Marge oder offene Zahlung
- Primaeraktionen

## 8.3 Schnellaktionen in der Summary-Bar

Empfohlen:

- Bearbeiten
- Datei hochladen
- E-Mail
- Rechnung
- Partner aendern

Nur im Overflow-Menue:

- seltene Spezialaktionen
- technische oder administrative Sonderwege

## 8.4 Soll-Aufbau des Overview-Tabs

```text
+-----------------------------------------------------+---------------------------+
| Basisdaten                                          | Aktueller Projektstatus   |
| Projektname                                         | Status                    |
| Sprachpaar                                          | Deadline                  |
| Prioritaet                                          | Dokumentenstatus          |
|                                                     | Rechnungsstatus           |
+-----------------------------------------------------+---------------------------+
| Kunde kompakt                                       | Partner kompakt           |
| Name                                                | Name                      |
| Hauptkontakt                                        | Hauptkontakt              |
| E-Mail / Telefon                                    | E-Mail / Telefon          |
| [Details einklappen/ausklappen]                     | [Details einklappen...]   |
+----------------------------------------------------------------------------------+
| Letzte Dateien / Letzte Aktivitaet / Letzte Rechnung                              |
+----------------------------------------------------------------------------------+
```

## 8.5 Was im Overview-Tab reduziert werden sollte

- komplette Adressen als immer offene Einzelfelder
- alle Zusatzmails direkt sichtbar
- alle Zusatztelefone direkt sichtbar
- tiefere Partner-Metadaten ohne unmittelbaren Arbeitswert

## 8.6 Dateien-Tab

Soll zuerst beantworten:

- wie viele Dateien gibt es
- was fehlt noch
- welche Datei ist neu oder relevant
- kann ich sofort hochladen

Empfehlung:

- oberhalb der Dateiliste eine kleine Files-Summary
- Upload-Button immer sichtbar
- Source und Target noch klarer gruppieren

## 8.7 Finanzen-Tab

Soll zuerst beantworten:

- Gesamt
- offen
- bereits bezahlt
- Marge
- Rechnungsstatus

Empfohlene Reihenfolge:

1. Finanzsummary
2. Positionen
3. Zusatzleistungen
4. Zahlungen
5. Rechnungserstellung

## 8.8 Kommunikation-Tab

Soll zuerst beantworten:

- mit wem spreche ich
- gibt es einen Gastlink
- was war die letzte Nachricht
- kann ich sofort antworten

Empfehlung:

- Kontaktheader kompakter
- Gastlink technisch kleiner, aber gut erreichbar
- Antworten und Dateiversand deutlicher als Primaeraktionen

## 9. Umsetzung in Releases

## Release 1

- Preset-Arbeitsansichten
- reduzierte Standardspalten
- sticky Projektlisten-Toolbar

## Release 2

- sticky Summary-Bar im Projektdetail
- sticky Tab-Leiste
- gestraffter Overview-Tab

## Release 3

- neue Logik "naechste Aktion"
- Finanzen und Kommunikation neu priorisieren
- kleine Inline-Quick-Actions

## 10. Entscheidungshilfe fuer Abnahme

Eine Aenderung fuer den Projektbereich sollte freigegeben werden, wenn:

- Nutzer schneller sehen, was heute relevant ist
- Nutzer weniger nach oben und unten scrollen muessen
- Nutzer weniger Modals fuer Standardaktionen brauchen
- die neue Loesung weiterhin wie Translator Office aussieht
- keine bestehende Business-Logik unsichtbar oder schwerer auffindbar wird

## 11. Empfehlung fuer den naechsten praktischen Schritt

Wenn direkt umgesetzt werden soll, ist die beste Startkombination:

1. Projektliste: Preset-Views
2. Projektliste: reduzierte Standardspalten
3. Projektdetail: sticky Summary-Bar

Diese drei Punkte liefern zusammen den groessten Unterschied fuer reale Nutzer bei relativ geringer visueller Umstellung.
