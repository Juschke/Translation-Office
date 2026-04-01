# UX Optimization: Projects

## 1. Ziel

Dieses Dokument beschreibt konkrete UX-Optimierungen fuer den Bereich Projekte, ohne die bestehende visuelle Identitaet von Translator Office zu verlassen. Der Fokus liegt auf:

- weniger Scrollen
- weniger Klicks
- klarerer Informationshierarchie
- schnelleren Standardaktionen
- konsistenter Beibehaltung des aktuellen UI-Stils

Betroffene Bereiche:

- [Projects.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\pages\Projects.tsx)
- [projectColumns.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\pages\projectColumns.tsx)
- [ProjectDetail.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\pages\ProjectDetail.tsx)
- [ProjectOverviewTab.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\components\projects\ProjectOverviewTab.tsx)
- [ProjectFilesTab.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\components\projects\ProjectFilesTab.tsx)
- [ProjectFinancesTab.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\components\projects\ProjectFinancesTab.tsx)
- [MessagesTab.tsx](C:\xampp\htdocs\Translation-Office\frontend\src\components\projects\MessagesTab.tsx)

## 2. Leitprinzip

Der Projektbereich soll sich weiterhin wie eine kompakte, professionelle Business-Anwendung anfuehlen. Optimiert wird nicht durch ein neues Design, sondern durch:

- bessere Priorisierung
- Verdichtung relevanter Daten
- Reduktion von Zweitinformationen im Erstzustand
- staerkere Direktmanipulation

## 3. Ist-Bild

### Projektliste

Staerken:

- leistungsfaehige Tabelle
- viele Filter
- sinnvolle KPI-Zeile
- Listen- und Kanbanansicht
- Bulk-Actions vorhanden

Reibung:

- zu viele gleichrangige Informationen in einzelnen Spalten
- Kunde und Partner sind in der Liste bereits sehr tief dargestellt
- Deadline ist stark sichtbar, aber naechste Aktion nicht
- Filter sind vorhanden, aber noch nicht in echte Arbeitsansichten uebersetzt
- Standardnutzer muss oft erst filtern, statt direkt in seinen Arbeitsmodus zu kommen

### Projektdetail

Staerken:

- inhaltlich vollstaendig
- gute Tab-Struktur
- starke Fachnaehe
- viele Aktionen direkt im Kontext

Reibung:

- zu viel Information schon im Uebersichts-Tab sichtbar
- viele Sekundaerdaten stehen auf derselben Ebene wie Primaerdaten
- wichtige Kennzahlen sind nicht immer sofort im Sichtbereich
- zentrale Aktionen sind verteilt
- auf langen Detailseiten entsteht unnötige Scrolltiefe

## 4. Zielbild

### Projektliste

Die Projektliste soll zuerst beantworten:

1. Was braucht heute Aufmerksamkeit?
2. Welches Projekt ist riskant?
3. Wo fehlt eine Zuweisung?
4. Was ist die naechste sinnvolle Aktion?

### Projektdetail

Das Projektdetail soll in den ersten Sekunden beantworten:

1. Worum geht es?
2. Wer ist beteiligt?
3. Bis wann muss etwas passieren?
4. Wie steht es wirtschaftlich?
5. Was ist die naechste sinnvolle Aktion?

## 5. Optimierungen fuer die Projektliste

## 5.1 Standardansichten statt nur Filter

Aktuell ist die Filterlogik stark, aber zu technisch. Fuer den Nutzer sollten vordefinierte Arbeitsansichten sichtbar sein:

- Meine offenen Projekte
- Heute faellig
- Ueberfaellig
- Ohne Partner
- Express / Hochprioritaet
- Zur Rechnung bereit

Nutzen:

- weniger Klicks bis zur relevanten Sicht
- weniger mentale Last
- schneller Tagesstart

Regel:

- diese Ansichten koennen visuell wie heutige Status-Tabs oder als Preset-Bar oberhalb der Tabelle erscheinen
- Design bleibt identisch zur bestehenden Toolbar-Logik

## 5.2 Spaltenhierarchie vereinfachen

Die aktuelle Tabelle zeigt in Kunde und Partner bereits sehr viele Details. Fuer die Standardansicht sollte die Priorisierung gestrafft werden.

Im Erstzustand sichtbare Spalten:

- Projektnummer + Projektname
- Kunde
- Sprachpaar
- Status
- Deadline
- Partnerstatus oder Partnername
- Gesamtpreis oder Marge
- naechste Aktion

In Zweitansicht oder zuschaltbaren Spalten:

- vollstaendige Kundenadresse
- E-Mail direkt in der Hauptzelle
- tiefe Partner-Metadaten
- Anzahlung als Standardspalte nur dann, wenn sie operativ wirklich taeglich gebraucht wird

Nutzen:

- bessere Scannbarkeit
- weniger horizontales und mentales Rauschen
- mehr Projekte pro Sichtbereich erfassbar

## 5.3 Neue Spalte "Naechste Aktion"

Aktuell erkennt man Status und Frist, aber die Konsequenz daraus muss der Nutzer selbst ableiten.

Empfehlung:

eine kompakte, textlich sehr kurze Aktionsspalte, zum Beispiel:

- Partner zuweisen
- Deadline pruefen
- Kunde informieren
- Rechnung erstellen
- Lieferung vorbereiten

Nutzen:

- weniger Nachdenken pro Zeile
- schnellere Priorisierung
- bessere Einarbeitung neuer Nutzer

## 5.4 Inline-Schnellaktionen ausbauen

Die Liste sollte mehr direkt loesbare Mikroaufgaben erlauben:

- Status wechseln
- Partner zuweisen
- Deadline anpassen
- E-Mail oeffnen
- Dateien oeffnen

Wichtig:

- nicht als neue laute Buttonreihe
- nur als kompakte Icon- oder Dropdown-Aktion im bestehenden Tabellenstil

## 5.5 Sticky Arbeitsleiste

Die Filter- und Action-Bar sollte beim Scrollen im Projektbereich sichtbar bleiben.

Enthalten:

- Suche
- aktive Ansicht
- aktive Filterzahl
- Export
- Spaltenkonfiguration

Nutzen:

- weniger Rueckscrollen
- schnelleres Umfiltern grosser Listen

## 5.6 KPI-Zeile auf operative Relevanz trimmen

Die vorhandenen KPIs sind sinnvoll, aber noch nicht maximal auf Arbeitssteuerung optimiert.

Empfohlene Standard-KPIs:

- Aktive Projekte
- Ohne Partner
- Heute / ueberfaellig
- Rechnung bereit oder offene Marge

Weniger wichtig fuer die Erstzeile:

- Kennzahlen, die eher Reporting-Charakter haben

## 5.7 Auswahl und Bulk-Actions intelligenter machen

Bulk-Actions sind vorhanden, aber der Einstieg kann klarer werden.

Empfehlung:

- Bulk-Leiste optisch noch staerker als temporaerer Arbeitsmodus
- nur fachlich sinnvolle Aktionen je View anzeigen
- Bulk-Leiste sticky oberhalb der Tabelle halten, solange Auswahl aktiv ist

## 5.8 Kanban klarer als Schnellsteuerung positionieren

Die Kanbanansicht ist sinnvoll, sollte aber als Status-Steuerungsmodus verstanden werden, nicht als vollwertiger Ersatz der Tabelle.

Empfehlung:

- oberhalb der Kanbanansicht kurz markieren, dass sie fuer Priorisierung und Statuswechsel gedacht ist
- in den Karten nur Kerninfos zeigen: Projekt, Kunde, Deadline, Preis, Prioritaet
- Detailtiefe in der Karte nicht weiter ausbauen

## 6. Optimierungen fuer das Projektdetail

## 6.1 Sticky Summary Bar oberhalb der Tabs

Die wichtigste Massnahme fuer weniger Scrollen.

Neue kompakte Summary-Zeile direkt unter dem Projektkopf:

- Projektnummer
- Projektname
- Sprachpaar
- Status
- Deadline
- Kunde
- Partner
- offene Zahlung oder Marge

Mit Direktaktionen:

- Bearbeiten
- Datei hochladen
- E-Mail
- Rechnung
- Partner aendern

Nutzen:

- Primaerkontext immer sichtbar
- weniger Tabwechsel und Rueckspruenge
- bessere Orientierung auf langen Detailseiten

## 6.2 Overview-Tab deutlich straffen

Der aktuelle Overview-Tab ist fachlich stark, aber in der Erstansicht zu ausfuehrlich.

Im Erstzustand sichtbar:

- Basisdaten
- Kunde kompakt
- Partner kompakt
- Dokumentenstatus
- Rechnungsstatus

Nur aufklappbar oder sekundär:

- vollstaendige Adressaufloesung in mehreren Einzelzeilen
- lange Kontaktlisten
- erweiterte Partnerdetails wie Bewertung oder Nebenspalten

Regel:

- "Wichtig fuer die naechste Entscheidung" oben
- "vollstaendige Stammdaten" als ausklappbarer Bereich darunter

## 6.3 Tab-Navigation sticky machen

Wenn der Nutzer in Dateien, Finanzen oder Kommunikation weit unten ist, sollte der Tab-Wechsel immer schnell moeglich bleiben.

Empfehlung:

- Tab-Leiste sticky unterhalb der Summary-Bar
- aktiver Tab klar sichtbar

Nutzen:

- deutlich weniger Rueckscrollen

## 6.4 Finanzen nach Entscheidungslogik strukturieren

Der Finanzbereich ist stark, aber aus Nutzersicht sollte die Reihenfolge noch klarer sein:

1. Was ist der aktuelle Gesamtwert?
2. Was ist offen?
3. Ist das Projekt profitabel?
4. Kann ich jetzt eine Rechnung erzeugen?
5. Welche Position verursacht den Aufwand?

Empfehlung:

- oben eine kleine Finanz-Summary
- darunter Positionen
- darunter Zahlungen
- Sidebar nur fuer zusammenfassende Werte und Primaeraktionen

## 6.5 Dateien als produktive Hauptflaeche behandeln

Dateien sind im Projektkontext eine Kernaufgabe.

Empfehlung:

- Source- und Target-Dateien klarer visuell gruppieren
- Anzahl und letzter Upload oben anzeigen
- Upload-Action sticky oder immer sichtbar
- bei leerem Zustand gezielt zu Upload fuehren

## 6.6 Kommunikation operativer machen

Die Messages-Ansicht ist funktional reich, aber fuer Standardarbeit etwas schwer.

Empfehlung:

- im Header der Kommunikationsansicht nur die wirklich wichtigen Kontaktinfos zeigen
- Gastlink und Portalaktionen kompakter machen
- Standardantworten oder letzte Vorlagen schneller erreichbar machen
- Dateianhaenge in Nachrichten kompakter und scannerfreundlicher darstellen

## 6.7 Sekundaerinfos einklappbar machen

Alles, was nicht taeglich fuer Entscheidungen gebraucht wird, sollte standardmaessig reduziert sein:

- lange Adressen
- Zusatzmails
- Zusatztelefone
- Detailwerte zu Nebenkonfigurationen
- technische oder historische Felder

Das spart:

- vertikale Hoehe
- visuelle Unruhe
- Suchzeit

## 7. Weniger Information im Erstzustand

Folgendes sollte in Projektliste und Projektdetail weniger prominent sein:

- komplette Adressen in Standardlisten
- zu viele Kontaktkanäle gleichzeitig
- tiefe interne Stammdaten ohne unmittelbaren Arbeitswert
- parallele Sekundaeraktionen auf gleicher Ebene wie Primaeraktionen
- Wiederholung gleicher Informationen in mehreren Bloecken

## 8. Mehr Information im Erstzustand

Folgendes sollte prominenter werden:

- was ist faellig
- was ist blockiert
- wer ist zugewiesen
- ob wirtschaftlich alles plausibel ist
- ob schon kommuniziert oder geliefert wurde
- welche naechste Aktion fachlich sinnvoll ist

## 9. Quick Wins

Diese Punkte haben hohen Nutzen bei geringer Designveraenderung:

1. Sticky Filter-/Toolbar in der Projektliste
2. vordefinierte Arbeitsansichten
3. reduzierte Standardspalten in der Liste
4. sticky Summary Bar im Projektdetail
5. Overview-Tab auf Primaerinfos verdichten
6. Tab-Leiste sticky machen

## 10. Mittelfristige Verbesserungen

1. Inline-Quick-Edit fuer Status, Partner und Deadline
2. Rechtsseitige Schnellvorschau fuer Projektinformationen aus der Liste
3. persoenliche gespeicherte Projektansichten
4. smartere Kommunikations-Shortcuts aus Projekt und Liste

## 11. Erfolgskriterien

Die Optimierung ist gelungen, wenn:

- Nutzer fuer Standardarbeit seltener in Modals springen muessen
- Projektpriorisierung ohne manuelle Tiefenfilterung moeglich ist
- im Detailkontext weniger nach oben und unten gescrollt wird
- die UI weiterhin klar als Translator Office erkennbar bleibt
- keine neue visuelle Sonderwelt entsteht

## 12. Empfohlene Umsetzungsreihenfolge

1. Projektliste: Preset-Views, Spaltenreduktion, sticky Arbeitsleiste
2. Projektdetail: sticky Summary Bar und sticky Tabs
3. Overview-Tab: Informationsreduktion und Klappbereiche
4. Finanzen und Kommunikation: bessere Ersthierarchie

## 13. Fazit

Der Projektbereich muss nicht neu gestaltet werden. Er ist bereits fachlich stark und visuell markant. Der groesste Nutzen liegt in besserer Priorisierung und klarerer Erstansicht. Wenn diese Optimierungen sauber umgesetzt werden, bleibt das aktuelle Corporate Design erhalten, waehrend Klicks, Scrollen und Suchzeit fuer Nutzer deutlich sinken.
