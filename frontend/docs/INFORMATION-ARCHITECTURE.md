# Information Architecture

## 1. Zielbild

Die Informationsarchitektur von Translator Office ist auf operative Sachbearbeitung ausgelegt. Nutzer sollen sich nicht durch abstrakte Menues arbeiten, sondern entlang realer Arbeitsobjekte und Geschaeftsfluesse navigieren:

- Projekte
- Kunden
- Partner
- Termine
- Dokumente
- Rechnungen
- Kommunikation
- Einstellungen

## 2. Primaere Navigationsstruktur

### Global sichtbare Bereiche

| Ebene | Bereich | Zweck |
|---|---|---|
| Hauptnavigation | Dashboard | Arbeitsstart und Priorisierung |
| Hauptnavigation | Projekte | zentrale Produktionssteuerung |
| Hauptnavigation | Dokumente | globale Dateiensicht |
| Hauptnavigation | Kunden | Auftraggeberseite |
| Hauptnavigation | Partner | Produktionsressourcen |
| Hauptnavigation | Kalender | Zeit- und Einsatzplanung |
| Hauptnavigation | Benachrichtigungen | Systemereignisse |
| Profilbereich | Profil | persoenlicher Kontext |

### Manager-Bereiche

| Bereich | Zweck |
|---|---|
| Rechnungen | Faktura und Forderungsstatus |
| Inbox | E-Mail-Arbeit |
| Reports | Analyse und Finanzsicht |
| Einstellungen | Mandantenkonfiguration |

### Owner-Bereiche

| Bereich | Zweck |
|---|---|
| Billing | Plan und Abrechnung |
| Team | Benutzer und Rollen |

## 3. Gruppierungslogik

Die Anwendung gruppiert Informationen nach Arbeitsverantwortung statt nach Technik:

- operative Produktion: Projekte, Kalender, Dokumente, Dolmetschen
- Stammdaten und Beziehungen: Kunden, Partner, Team
- kaufmaennische Steuerung: Rechnungen, Reports, Billing
- Kommunikation und Signale: Inbox, Benachrichtigungen
- Konfiguration: Einstellungen

## 4. Seitentypen

### Uebersichtsseite

Beispiele:

- Dashboard
- Reports
- Billing

Struktur:

- Header
- KPI-Zeile
- Analyse- oder Content-Bloecke

### Arbeitsliste

Beispiele:

- Projekte
- Kunden
- Rechnungen
- Dokumente
- Dolmetschen

Struktur:

- Header mit Add-Action
- KPI-Zeile optional
- DataTable als Kern
- Filter und Suche
- Bulk-Actions bei Selektion

### Detailarbeitsseite

Beispiele:

- Projektdetail
- Kunden- und Partnerdetail

Struktur:

- Identitaetskopf
- Kontextaktionen
- Tabnavigation
- tiefe Fachbereiche

### Split-View-Arbeitsseite

Beispiele:

- Inbox
- Guest Portal

Struktur:

- linke Auswahl- oder Ordnungsseite
- rechte Detailseite
- schnelle Kontextwechsel

### Konfigurationsseite

Beispiel:

- Einstellungen

Struktur:

- Seitenleiste mit Themenbereichen
- Inhaltsflaeche rechts
- Unterstruktur fuer Stammdaten

## 5. Sekundaere Navigation

### Dropdown-Navigation

Wird eingesetzt, wenn ein Hauptmenue mehrere fachlich eng gekoppelte Unterbereiche traegt:

- Kunden
- Partner
- Einstellungen

### In-Page-Tabs

Werden verwendet, wenn mehrere Perspektiven auf dasselbe Objekt bestehen:

- Projektdetail
- Reports
- Settings

### Kontextuelle Badges

Badges steuern nicht nur Aufmerksamkeit, sondern auch Priorisierung:

- offene Projekte
- unbezahlte Rechnungen
- ungelesene E-Mails
- offene Benachrichtigungen

## 6. Objektmodell aus Nutzersicht

| Objekt | Verknuepfungen |
|---|---|
| Projekt | Kunde, Partner, Dateien, Nachrichten, Zahlungen, Rechnung, Termine |
| Kunde | Projekte, Rechnungen, Kommunikation |
| Partner | Projekte, Dolmetschtermine, Abrechnung |
| Rechnung | Projekt, Kunde, Status, Export, Zahlung |
| Termin | Projekt oder Mitarbeiter oder Dolmetscheinsatz |
| Datei | Projekt, Typ, Version, Uploader |

Konsequenz fuer die IA:

- Projekte sind das Produktzentrum.
- Kunden und Partner flankieren das Projekt.
- Rechnungen und Reports beziehen sich auf kaufmaennische Verdichtung.
- Kalender und Inbox sind keine Nebenmodule, sondern querliegende Arbeitsschichten.

## 7. Typische Journeys

### Journey A: Projektproduktion

1. Dashboard oder Projektliste oeffnen
2. neues Projekt anlegen
3. Kunde und Sprachen setzen
4. Dateien hochladen
5. Partner zuteilen
6. Deadline im Kalender oder im Projekt steuern
7. Kommunikation fuehren
8. Lieferung und Rechnung ausloesen

### Journey B: Forderungsmanagement

1. Rechnungen oeffnen
2. Statusfilter "offen", "ueberfaellig" oder "Mahnungen" nutzen
3. Einzel- oder Massenaktion ausfuehren
4. PDF oder DATEV exportieren
5. Zahlung verbuchen oder archivieren

### Journey C: Ressourcenplanung

1. Kalender oeffnen
2. unzugeordnetes Projekt oder Mitarbeiter in Seitenleiste sehen
3. per Drag-and-drop oder Modal verplanen
4. bei Bedarf in Projekt- oder Dolmetschdetail springen

### Journey D: Externer Austausch

1. Gastlink oeffnen
2. Projektdaten lesen
3. Dateien herunterladen oder hochladen
4. Nachrichten austauschen
5. Kontaktdaten pruefen oder aktualisieren

## 8. Workspace-Logik

Die Workspace Tabs schaffen eine zweite Navigationsebene fuer aktive Arbeitskontexte.

Sie sind besonders sinnvoll fuer:

- mehrere geoeffnete Projekte
- Wechsel zwischen Kunden- und Partnerdetails
- paralleles Arbeiten mit Einstellungen und Details

Regeln:

- Uebersichten bleiben in der Hauptnavigation
- tiefe Kontexte duerfen als Tabs fortleben
- Tabs sind Arbeitskontexte, keine globalen Menues

## 9. Rollenbasierte Sichtbarkeit

### Employee

- Dashboard
- Projekte
- Kalender
- Dokumente
- Kunden
- Partner
- Benachrichtigungen
- Profil

### Manager

Employee plus:

- Rechnungen
- Inbox
- Reports
- Einstellungen

### Owner

Manager plus:

- Team
- Billing

## 10. IA-Regeln fuer neue Features

Neue Features sollten in die bestehende Struktur nur dann als Top-Level-Bereich aufgenommen werden, wenn sie:

- haeufig genutzt werden
- einen eigenen Arbeitskontext besitzen
- nicht sauber in Projekt, Kunde, Partner, Rechnung oder Einstellungen aufgehen

Sonst gilt:

- objektnahes Feature in die passende Detailseite
- konfigurierbares Feature in Einstellungen
- kaufmaennisches Feature in Rechnungen oder Reports
- zeitbezogenes Feature in Kalender
- externer Austausch in Inbox oder Guest-Flows

## 11. Architekturelle Soll-Regeln

- Die Hauptnavigation bleibt schlank.
- Objektlogik geht vor Techniklogik.
- Datenlisten sind Einstiegspunkte, keine Sackgassen.
- Detailseiten muessen Anschlussaktionen anbieten.
- Kein neuer Bereich ohne klare Rollen- und Kontextdefinition.

## 12. Ergebnis

Die aktuelle Informationsarchitektur ist bereits stark und fachlich nachvollziehbar. Sie funktioniert besonders gut, weil sie das Produkt um reale Arbeitsobjekte organisiert. Der naechste Reifegrad besteht nicht in einer kompletten Umstrukturierung, sondern in konsequenterer Vereinheitlichung von Seitentypen, Benennungen, Badges und Statusmustern.
