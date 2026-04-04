# Translator Office Frontend

Das Frontend von Translator Office ist eine rollenbasierte React-SPA fuer ein mehrmandantenfaehiges Translation Management System. Die Anwendung verbindet klassische ERP-Klarheit mit moderner SPA-Interaktion: kompakte Arbeitsoberflaechen, schnelle Tabellen, starke Statusfuehrung, klare Handlungswege und ein bewusst sachliches Corporate Design fuer Uebersetzungsbueros, Sprachdienstleister und projektgetriebene Teams.

## Zweck dieser Dokumentation

Dieses README ersetzt die bisherige Kurzbeschreibung durch eine belastbare Produkt- und Systemdokumentation, die den aktuellen Ist-Zustand des Frontends widerspiegelt. Sie ist bewusst praxisorientiert aufgebaut und soll drei Dinge leisten:

1. Das Produktbild und die Informationsarchitektur schnell verstaendlich machen.
2. Das aktuelle Corporate Design in Worte, Regeln und wiederverwendbare Muster uebersetzen.
3. Das taegliche Arbeiten fuer Entwickler, Designer, QA und Produktverantwortliche strukturieren.

## Dokumenten-Set

Die folgenden Dokumente gehoeren zusammen und bilden die neue Arbeitsgrundlage fuer das Frontend:

- [Corporate Design](C:\xampp\htdocs\Translation-Office\frontend\docs\CORPORATE-DESIGN.md)
- [Feature Inventory](C:\xampp\htdocs\Translation-Office\frontend\docs\FEATURE-INVENTORY.md)
- [Information Architecture](C:\xampp\htdocs\Translation-Office\frontend\docs\INFORMATION-ARCHITECTURE.md)
- [Working Rules](C:\xampp\htdocs\Translation-Office\frontend\docs\WORKING-RULES.md)

## Produktprofil

Translator Office ist kein generisches SaaS-Dashboard, sondern eine operative Fachanwendung fuer das Tagesgeschaeft eines Uebersetzungsbueros. Das Frontend deckt die komplette Kette von Anfrage, Projektplanung und Dateiverwaltung bis zu Abrechnung, Kommunikation, Reporting und Mandantenverwaltung ab.

Der aktuelle Character des Produkts laesst sich so zusammenfassen:

- vertrauenswuerdig statt verspielt
- kompakt statt luftig
- arbeitsorientiert statt marketinglastig
- statusgetrieben statt contentgetrieben
- ERP-nah in Tabellen und Aktionen, modern in Layout, Navigation und Reaktionsgeschwindigkeit

## Hauptmodule

| Bereich | Route(s) | Rolle | Zweck |
|---|---|---|---|
| Dashboard | `/` | Employee+ | Tageslage, KPI-Einstieg, Schnellaktionen |
| Projekte | `/projects`, `/projects/:id` | Employee+ | Operative Projektsteuerung inkl. Kanban, Dateien, Finanzen, Kommunikation |
| Kalender | `/calendar` | Employee+ | Termin- und Einsatzplanung, Projektdeadlines |
| Dokumente | `/documents` | Employee+ | Zentrale Dateiuebersicht ueber alle Projekte |
| Kunden | `/customers`, `/customers/:id` | Employee+ | Kundenstamm, Umsatzsicht, Kontakt- und Statuspflege |
| Partner | `/partners`, `/partners/:id` | Employee+ | Uebersetzer- und Partnerverwaltung |
| Dolmetschen | `/interpreting` | Employee+ | Einsatzplanung, Zuweisungen, Bestaetigungen |
| Rechnungen | `/invoices`, `/invoices/new` | Manager+ | Faktura, Statussteuerung, Export, Druck, Mahnlogik |
| Inbox | `/inbox` | Manager+ | E-Mail-Hub mit Ordnern, Vorlagen, Konten und Composer |
| Reports | `/reports` | Manager+ | Analyse, UStVA-nahe Finanzsicht, Profitabilitaet, OPOS, BWA |
| Einstellungen | `/settings` | Manager+ | Unternehmen, Nummernkreise, Vorlagen, Stammdaten, Audit |
| Team | `/team` | Owner | Benutzer- und Rollenverwaltung |
| Billing | `/billing` | Owner | Plaene, Zahlung, Rechnungsverlauf |
| Profil / Hinweise | `/profile`, `/notifications` | Employee+ | Selbstverwaltung, Systemkommunikation |
| Guest Portal | `/guest/project/:token` | Extern | Sichere Kunden- oder Partneransicht fuer Projektfreigabe und Austausch |

## Visuelle Identitaet in Kurzform

Das aktuelle Frontend basiert auf einer klar erkennbaren Designsignatur:

- Brand Primary: dunkles Teal `#1B4D4F`
- Brand Accent: aktives Gruen `#9BCB56`
- App Background: ruhiges Off-White `#F4F7F6`
- Primaerschrift: Inter
- Displayschrift: Montserrat
- Daten- und Tabellenlogik: kompakt, stark gerastert, an klassische Business-Software angelehnt

Wichtig: Das System ist visuell bewusst hybrid. Karten, Navigation und Auth-Strecken sind modern-minimal. Tabellen, Buttons und Filterleisten zitieren bewusst klassische Business- und Bootstrap-Muster. Diese Mischung ist aktuell Teil der Produktidentitaet und sollte nicht versehentlich geglaettet oder in ein beliebiges SaaS-Design umgebaut werden.

## Architektonische Leitplanken

- React 19 mit TypeScript und Vite
- TanStack Query fuer Server-State
- Axios-Service-Layer in `src/api/services`
- Rollenlogik ueber Auth Context und `RoleGuard`
- Mehrsprachigkeit ueber `i18next`
- Tailwind CSS v4 fuer Layout und Oberflaechenlogik
- Ant Design fuer datenintensive Bausteine, stark ueberschrieben durch das Produktdesign
- Radix/shadcn-basierte UI-Bausteine fuer primitive Controls
- Realtime- und Polling-Verhalten fuer operative Ansichten

## Frontend-Prinzipien

Alle kuenftigen Aenderungen im Frontend sollten sich an diesen Prinzipien orientieren:

- Jede Seite braucht eine klare Arbeitsaufgabe.
- Primaeraktionen muessen im sichtbaren Bereich liegen.
- Status, Faelligkeit und Verantwortlichkeit muessen ohne Scrollen erfassbar sein.
- Tabellen sind Arbeitsflaechen, keine blossen Darstellungen.
- Modals dienen dem schnellen Bearbeiten; Detailseiten dienen dem tiefen Kontext.
- Farben duerfen Bedeutung tragen, aber nie alleinige Bedeutungstraeger sein.
- Jede neue Funktion muss die bestehende Rollen- und Mandantenlogik respektieren.

## Arbeitsrelevante Besonderheiten des Produkts

- Die Top-Navigation ist die primaere Bereichsnavigation.
- Workspace Tabs bilden parallele Arbeitskontexte fuer Detailansichten.
- KPI-Karten sind kein reines Deko-Element, sondern Navigations- und Priorisierungswerkzeug.
- Datentabellen sind absichtlich kompakt, sortierbar, filterbar und spaltenkonfigurierbar.
- Detailseiten folgen meistens einem Tab-Modell mit Stammdaten, Dokumenten, Kalkulation und Kommunikation.
- Externe Portale nutzen dieselbe visuelle Sprache, aber mit reduzierter Funktionstiefe.

## Entwicklung

### Start

```bash
npm install
npm run dev
```

### Qualitaetssicherung

```bash
npm run build
npm run lint
```

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| `src/pages` | Routbare Seiten und Arbeitsbereiche |
| `src/components/ui` | Basale UI-Primitives |
| `src/components/common` | Produktnahe, wiederverwendete Arbeitsbausteine |
| `src/components/*` | Bereichsspezifische Komponenten |
| `src/api/services` | API-Fassade pro Geschaeftsbereich |
| `src/context` | Auth, Confirmation, Workspace Tabs |
| `src/hooks` | wiederverwendete Verhaltenslogik |
| `src/lib` | Theme, Utilities, Hilfsfunktionen |
| `src/locales` | Uebersetzungen |
| `public` | statische Assets, inklusive Platzhalterhinweisen fuer Auth-Hero |

## Empfohlene Nutzung der neuen Dokus

- Produktverantwortliche starten mit dem README und dem Feature Inventory.
- UI/UX-Arbeit startet mit dem Corporate Design und der Information Architecture.
- Entwickler arbeiten bei neuen Screens oder Refactorings zusaetzlich mit den Working Rules.
- QA und Abnahme nutzen vor allem Feature Inventory und Working Rules als Sollbild.

## Aktueller Status der Doku

Diese Dokumentation basiert auf einem Code-Scan des vorhandenen Frontends, der Routen, Layouts, Basiskomponenten, Seitentypen und Styling-Tokens. Sie beschreibt den aktuellen Stand der Anwendung und fuehrt daraus verbindliche Gestaltungs- und Arbeitsregeln ab. Sie ist damit bewusst kein Wunschbild fuer spaeter, sondern ein belastbarer Ist-Stand mit klaren Leitplanken fuer die naechsten Schritte.
