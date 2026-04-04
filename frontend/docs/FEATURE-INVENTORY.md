# Feature Inventory

## 1. Ziel

Dieses Dokument beschreibt die vorhandenen Frontend-Funktionen entlang der realen Routen, Seitentypen, Komponentenfamilien und Services. Es dient als Inventar fuer Produktarbeit, QA, Priorisierung und technische Weiterentwicklung.

## 2. Querschnittsfunktionen

### Authentifizierung und Rollen

- Tokenbasierte Anmeldung
- Login, Registrierung, Passwort-Reset
- Two-Factor-Step im Loginfluss
- Onboarding fuer authentifizierte Nutzer ohne Tenant
- Rollenbasierte Sichtbarkeit mit `owner`, `manager`, `employee`

### Navigation und Arbeitskontext

- persistente Top-Navigation
- mobile Navigation
- Benachrichtigungs-Dropdown
- Sprachumschaltung
- Profilmenu
- Workspace Tabs fuer paralleles Arbeiten

### Daten- und Realtime-Verhalten

- TanStack Query fuer alle Kernbereiche
- Prefetching wichtiger Stammdaten im App-Layout
- Polling in operativen Bereichen
- Realtime-Invalidierung fuer Projektkontexte

### Globale Hilfsmittel

- Toaster fuer Feedback
- Keyboard-Shortcut-Hilfe
- Confirm-Modals
- Bulk-Actions
- Skeleton-States

## 3. Moduluebersicht

### Dashboard

**Route:** `/`

**Ziel:** Tagesstart, Priorisierung, Einstieg in operative Arbeit

**Kernfunktionen:**

- KPI-Uebersicht fuer offene Projekte, Fristen, Umsatz und Inbox
- Schnellaktionen fuer neues Projekt, neuen Kunden und neuen Partner
- Sprachumsatz nach Quell- und Zielsprache
- kompakte Zusammenfassung im Seitenpanel
- Liste zuletzt bearbeiteter Projekte

### Projekte

**Route:** `/projects`

**Ziel:** zentrale operative Steuerung aller Uebersetzungsprojekte

**Kernfunktionen:**

- Listen- und Kanbanansicht
- Status- und Archivlogik
- schnelle Filter fuer Projektzustand
- erweiterte Filter fuer Sprache, Kunde, Partner, Deadline, Prioritaet, Zertifizierung, Apostille
- Exportfunktionen
- Bulk-Actions fuer Statuswechsel, Archiv, Trash, E-Mail und Loeschung

### Projektdetail

**Route:** `/projects/:id`

**Ziel:** vollstaendige Bearbeitung eines Projekts in einem Detailkontext

**Kernfunktionen:**

- Stammdaten und Projektmetadaten
- Partner- und Kundenzuordnung
- Dateiverwaltung inklusive Upload, Download, Vorschau, Rename, Move und ZIP
- Kalkulation, Positionen, Zahlungen, Rechnungsableitung
- Kommunikation
- Historie
- projektbezogene E-Mail-Komposition
- Dolmetscher- und Teilnehmerlogik

**Tabstruktur:**

- Stammdaten
- Dokumente
- Kalkulation
- Kommunikation
- Historie

### Kunden

**Route:** `/customers`, `/customers/:id`

**Ziel:** Kundenstamm pflegen und wirtschaftlich bewerten

**Kernfunktionen:**

- Tabellenansicht mit Umsatz- und Projektbezug
- Filter nach Ansicht und Kundentyp
- KPI-Karten fuer Bestand, Neueintraege, Top-Kunde, Umsatztrend
- Neuanlage und Bearbeitung per Modal
- Bulk-Actions fuer Aktivieren, Deaktivieren, Archiv, Trash, Wiederherstellen
- Direktuebergabe an Inbox fuer Sammel-E-Mails

### Partner

**Route:** `/partners`, `/partners/:id`

**Ziel:** Sprachpartner, Uebersetzer und externe Ressourcen verwalten

**Kernfunktionen laut Struktur und Komponentenlage:**

- Partnerstammdaten
- interne und abrechnungsrelevante Abschnitte
- Preis- und Satzlogik
- Duplikatpruefung
- Detailansicht mit Billing-Tab

### Dolmetschen

**Route:** `/interpreting`

**Ziel:** Dolmetscher-Einsaetze separat vom Standardprojektbetrieb steuern

**Kernfunktionen:**

- Terminliste fuer Einsaetze
- Zuweisung von Projekt, Kunde und Partner
- KPI-Karten fuer kommende und abgeschlossene Einsaetze
- Projektwahl via Modal
- Bestaetigungsablauf fuer Dolmetscher

### Dokumente

**Route:** `/documents`

**Ziel:** projektuebergreifender Dateiindex

**Kernfunktionen:**

- globale Dateiliste
- Filter nach Typ und Erweiterung
- Download und Loeschen
- Sprung ins zugehoerige Projekt
- Kennzahlen zu Anzahl, Typverteilung und Speicherverbrauch

### Kalender

**Route:** `/calendar`

**Ziel:** zeitliche Planung von Projekten, Terminen, Personal und Dolmetscheinsaetzen

**Kernfunktionen:**

- Monats-, Wochen- und Tagesansicht
- Drag-and-drop fuer Projektdeadlines und Einsaetze
- Seitenspalte fuer unzugeordnete Projekte
- Seitenspalte fuer Mitarbeiter
- schnelle Erstellung von Standardterminen und Dolmetschterminen
- unterschiedliche Eventtypen mit typischer Farb- und Iconlogik

### Rechnungen

**Route:** `/invoices`, `/invoices/new`, `/invoices/:id/edit`

**Rolle:** Manager+

**Ziel:** operative Faktura und finanzielle Statussteuerung

**Kernfunktionen:**

- Listenansicht fuer Rechnungen und Gutschriften
- Statusfilter inkl. offen, bezahlt, ueberfaellig, Mahnungen, storniert
- DATEV-CSV und weitere Exporte
- Drucken, PDF, XML
- Rechnungsausgabe, Storno, Bezahltmarkierung
- Bulk-Actions fuer bezahlt, Mahnungen, Archiv und Wiederherstellung
- Vorschau ueber Modal

### Inbox / Communication Hub

**Route:** `/inbox`

**Rolle:** Manager+

**Ziel:** zentrale E-Mail-Arbeit innerhalb der Anwendung

**Kernfunktionen:**

- Ordner fuer Inbox, Sent, Archive, Trash
- Lesen, Antworten, Weiterleiten, Archivieren, Wiederherstellen
- Massenaktionen
- Synchronisation mit Postfach
- E-Mail-Vorlagen verwalten
- E-Mail-Konten verwalten
- Composer mit Projektbezug

### Reports

**Route:** `/reports`

**Rolle:** Manager+

**Ziel:** betriebswirtschaftliche und operative Auswertung

**Hauptbereiche:**

- grafische Analyse
- Finanz-Auswertung

**Finanz-Unterbereiche:**

- Tax
- Profitability
- OPOS
- BWA

### Einstellungen

**Route:** `/settings`

**Rolle:** Manager+

**Haupttabs:**

- Unternehmen
- Nummernkreise
- Rechnungen
- Stammdaten
- Benachrichtigungen
- Audit

**Stammdaten-Unterbereiche:**

- Sprachen
- Dokumententypen
- Leistungen
- E-Mail-Vorlagen
- Fachgebiete
- Einheiten
- Waehrungen
- Projektstatus

### Team

**Route:** `/team`

**Rolle:** Owner

**Ziel:** interne Nutzerverwaltung des Tenants

**Kernfunktionen:**

- Nutzer anlegen
- Nutzer bearbeiten
- Rolle setzen
- Status setzen
- loeschen

### Billing

**Route:** `/billing`

**Rolle:** Owner

**Ziel:** Plan- und Abrechnungsmanagement fuer den Tenant

**Kernfunktionen:**

- aktueller Plan
- Paketwechsel
- Zahlungsmethode
- Rechnungshistorie
- statusnahe Vertragsdarstellung

### Benachrichtigungen

**Route:** `/notifications`

**Ziel:** systemweite Ereignisse lesen und abarbeiten

**Kernfunktionen:**

- Filter nach Alle, Ungelesen, Erfolg, Warnung, Info
- Gruppierung nach Zeitraeumen
- Einzelmarkierung und Sammelmarkierung
- Navigation in zugehoerige Projekte

### Profil

**Route:** `/profile`

**Ziel laut Struktur:** nutzerbezogene Einstellungen und persoenliche Daten

### Guest Portal

**Route:** `/guest/project/:token`

**Ziel:** externer Zugriff fuer Kunden oder Partner auf einen einzelnen Projektkontext

**Kernfunktionen:**

- Projektkopf
- Projektdetails
- Dateiliste mit Download und Upload
- Nachrichtenbereich
- Kundeninformationspflege fuer Customer-Rolle

## 4. Wiederkehrende Geschaeftsfluesse

### Anfrage bis Lieferung

1. Projekt anlegen
2. Kunde zuordnen
3. Sprachen und Dokumenttypen definieren
4. Dateien hochladen
5. Partner zuweisen
6. Deadline steuern
7. Kommunikation fuehren
8. Lieferung und Rechnungsstellung ausloesen

### Rechnung bis Zahlung

1. Rechnung aus Projekt oder direkt erzeugen
2. Status ausgeben
3. PDF/XML/Druck/DATEV erzeugen
4. ueberfaellige Posten und Mahnungen verfolgen
5. Zahlung verbuchen oder archivieren

### Ressourcenplanung

1. unzugeordnetes Projekt oder Mitarbeiter im Kalender sehen
2. per Drag-and-drop oder Modal verplanen
3. Termin oder Einsatz aktualisieren
4. Projekt- oder Dolmetschkontext weiterbearbeiten

## 5. Produktrelevante Besonderheiten

- Die Anwendung ist eindeutig fuer den deutschsprachigen Geschaeftskontext gebaut.
- Rechnungs- und Steuerlogik sind nicht Nebenfunktion, sondern Kernprodukt.
- Dateien, Kommunikation und Kalkulation sind direkt im Projektkontext verzahnt.
- Arbeitsdruck wird ueber Badges, KPIs, Fristen und Filter sichtbar gemacht.
- Guest- und Partnernaehe sind funktional bereits angelegt und kein spaeteres Add-on.
