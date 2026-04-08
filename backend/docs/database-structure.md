# Datenbankstruktur

Stand: abgeleitet aus [database/schema/mysql-schema.sql](../database/schema/mysql-schema.sql) am 7. April 2026.

Diese Datei ist die schnelle Uebersicht fuer Entwickler und KI-Agenten. Sie beschreibt nicht jede einzelne Spalte, sondern die fachliche Struktur, die wichtigsten Beziehungen und die Stellen, an denen Aenderungen besonders risikoreich sind.

## 1. Architektur in einem Satz

Die Datenbank bildet ein mandantenfaehiges TMS-/Backoffice-System fuer Uebersetzungsbueros ab: `tenant -> users/customers/partners/projects -> files/messages/payments/invoices`, erweitert um Portale, Mail, Subscriptions, Mahnwesen und Stammdaten.

## 2. Wichtigste Regel zuerst

- Multi-Tenancy ist zentral.
- Fast alle fachlichen Tabellen haengen direkt oder indirekt an `tenants`.
- Bei neuen Queries, Scopes, Joins, Policies und Hintergrundjobs immer zuerst pruefen:
  - gehoert der Datensatz zu einem `tenant_id`?
  - kann ein Benutzer fremde Tenant-Daten sehen?
  - fehlt bei Reports, Exports oder Admin-Ansichten ein Tenant-Filter?

## 3. Domaenen-Uebersicht

### 3.1 Tenant und Benutzer

- `tenants`
  - oberste Mandanten-Einheit
  - enthaelt Firmen-, Kontakt-, Bank- und Steuerdaten
- `tenant_settings`
  - Key-Value-Konfiguration pro Tenant
- `users`
  - Benutzer eines Tenants
  - enthaelt Login-, Rollen- und Verwaltungsinformationen
- `personal_access_tokens`
  - Sanctum API Tokens
- `subscriptions`
  - Abo-Historie pro Tenant
- `tenant_invoices`
  - Rechnungen fuer das SaaS-/Lizenzmodell

Kernbeziehungen:
- `tenants 1:n users`
- `tenants 1:n tenant_settings`
- `tenants 1:n subscriptions`
- `subscriptions 1:n tenant_invoices` oder `tenant_invoices -> subscription`

### 3.2 Stammdaten und Kataloge

- `languages`
- `document_types`
- `services`
- `specializations`
- `units`
- `currencies`
- `price_matrices`
- `project_statuses`
- `email_templates`

Zweck:
- wiederverwendbare Stammdaten pro Tenant
- Preis- und Sprachlogik
- konfigurierbare Projekt- und Dokumenttypen

Wichtige Beziehungen:
- `price_matrices -> languages` ueber `source_lang_id` und `target_lang_id`
- `customers -> price_matrices`
- `projects -> languages`
- `projects -> document_types`

### 3.3 CRM und Beteiligte

- `customers`
  - Kunden, Ansprechpartner, Rechnungs- und Portalinformationen
  - enthaelt auch Portal-Zugangsstatus
- `partners`
  - externe Sprachdienstleister / Lieferanten

Wichtige Beziehungen:
- `customers 1:n projects`
- `customers 1:n invoices`
- `partners 1:n projects` (optional)
- `appointments` kann an `customer_id`, `partner_id`, `project_id`, `user_id` haengen

Besonderheiten:
- `customers` hat `created_by` und `updated_by` auf `users`
- `customers` enthaelt Portal-bezogene Felder wie `portal_access`, Login-/Token-Zeitpunkte

### 3.4 Projektabwicklung

- `projects`
  - zentrale fachliche Tabelle
  - verbindet Kunde, Partner, Sprachen, Dokumenttyp, Status, Preise, Deadlines
- `project_positions`
  - Leistungs-/Positionsdaten eines Projekts
- `project_files`
  - Dateien am Projekt
- `project_payments`
  - Zahlungen bzw. Zahlungsinformationen am Projekt
- `messages`
  - projektbezogene Kommunikation
- `appointments`
  - Termine fuer Projekt, Kunde, Partner oder Benutzer
- `external_costs`
  - externe Zusatzkosten am Projekt

Wichtige Beziehungen:
- `projects belongsTo customers`
- `projects belongsTo partners`
- `projects belongsTo languages (source/target)`
- `projects belongsTo document_types`
- `projects 1:n project_positions`
- `projects 1:n project_files`
- `projects 1:n project_payments`
- `projects 1:n messages`
- `projects 1:n invoices`
- `projects 1:n appointments` (optional)
- `projects 1:n external_costs` (optional)

Besonderheiten:
- `projects` hat `access_token` und `partner_access_token` fuer Portal-/Extranetzugriffe
- Projektstatus ist aktuell sowohl als Feld im Projekt als auch ueber die Stammdatentabelle `project_statuses` relevant

### 3.5 Rechnungen, Mahnwesen und Wiederholungen

- `invoices`
  - zentrale Rechnungstabelle
  - GoBD-orientiert, mit Snapshot-Feldern fuer Kunde, Verkaeufer und Projekt
- `invoice_items`
  - Positionen einer Rechnung
- `invoice_audit_logs`
  - unveraenderliche Aenderungshistorie / Audit Trail
- `dunning_settings`
  - Mahnregeln pro Tenant
- `dunning_logs`
  - versendete Mahnstufen / Mahnhistorie
- `recurring_invoices`
  - Wiederholungslogik fuer Serienrechnungen

Wichtige Beziehungen:
- `invoices belongsTo tenants`
- `invoices belongsTo customers`
- `invoices belongsTo projects`
- `invoices belongsTo recurring_invoices` (optional)
- `invoices self-reference cancelled_invoice_id`
- `invoice_items belongsTo invoices`
- `invoice_audit_logs belongsTo invoices`
- `dunning_logs belongsTo invoices`
- `dunning_settings belongsTo tenants` mit Unique auf `tenant_id`
- `recurring_invoices belongsTo tenants`
- `recurring_invoices belongsTo customers` (optional)
- `recurring_invoices belongsTo template_invoice` (optional)

Wichtige fachliche Besonderheiten:
- Rechnungen snapshotten Kundendaten und Seller-Daten fuer die Anzeige
- `project_id` und `customer_id` in `invoices` sind interne Referenzen, nicht die Anzeigequelle
- bereits ausgestellte Rechnungen sind im Modell gegen normale spaetere Aenderungen geschuetzt

### 3.6 Mail und Kommunikation

- `mail_accounts`
- `mail_signatures`
- `mail_templates`
- `mails`
- `sent_emails`
- `messages`

Zweck:
- E-Mail-Konten und Signaturen pro Tenant
- ein- und ausgehende Mailprozesse
- projektnahe Kommunikation

Wichtige Beziehungen:
- `mail_signatures -> mail_accounts`
- `mails -> mail_accounts`
- `mails -> tenants`
- `messages -> projects`
- `messages -> users`
- `messages -> project_files` (optional)

### 3.7 System, Betrieb und Observability

- `activity_log`
- `api_request_logs`
- `notifications`
- `health_check_result_history_items`
- `pulse_*`
- `telescope_*`
- `jobs`
- `job_batches`
- `failed_jobs`
- `cache`
- `cache_locks`
- `sessions`
- `migrations`

Zweck:
- technische Beobachtbarkeit
- Queue-Verarbeitung
- Performance- und Health-Monitoring
- Laravel-Basisinfrastruktur

## 4. Fachliche Kernbeziehungen als Kurzgraph

```text
tenants
  -> users
  -> customers -> projects -> project_files
                     |         -> messages
                     |         -> project_positions
                     |         -> project_payments
                     |         -> invoices -> invoice_items
                     |                      -> invoice_audit_logs
                     |                      -> dunning_logs
                     |
                     -> appointments
  -> partners -> projects
  -> languages
  -> document_types
  -> services
  -> email_templates
  -> specializations
  -> units
  -> currencies
  -> project_statuses
  -> subscriptions -> tenant_invoices
  -> dunning_settings
  -> recurring_invoices -> invoices
  -> mail_accounts -> mails / mail_signatures
```

## 5. Tabellen mit besonders hoher Aenderungsgefahr

Diese Tabellen sind fachlich oder technisch sensibel. Aenderungen hier immer mit besonderer Vorsicht:

- `tenants`
  - zentrale Mandantenbasis, viele Downstream-Abhaengigkeiten
- `users`
  - Auth, Rollen, Policies, Portal-Zugriffe
- `customers`
  - CRM, Portal, Rechnungsbezug
- `projects`
  - Kernprozess des Produkts
- `project_files`
  - Uploads, Sharing, Portale, Dateireferenzen
- `invoices`
  - GoBD, Snapshots, Statuslogik, Mahnwesen
- `invoice_items`
  - Finanzsummen und Anzeige
- `subscriptions` / `tenant_invoices`
  - SaaS-Abrechnung
- `mail_accounts` / `mails`
  - produktionsnahe Integrationen und Externals

## 6. Was Entwickler und KI-Agenten bei Aenderungen immer pruefen sollten

### Bei neuen Tabellen

- braucht die Tabelle `tenant_id`?
- welche Delete-Strategie ist richtig: `cascade`, `set null` oder bewusst nichts?
- braucht die Tabelle Indizes fuer Tenant + Status + Datum?
- ist die Tabelle eher Stammdaten-, Prozess- oder Audit-Datenmodell?

### Bei Aenderungen an Projekten

- sind Portal-Token oder Partnerzugriffe betroffen?
- brechen Projektstatus, Deadlines oder File-Beziehungen?
- sind Rechnungs- oder Zahlungsfluesse implizit mit betroffen?

### Bei Aenderungen an Rechnungen

- wird versehentlich Snapshot-Logik umgangen?
- bleibt die GoBD-/Immutability-Logik erhalten?
- sind Dunning-, Credit-Note- und Recurring-Faelle mitgedacht?

### Bei Aenderungen an Kunden

- sind Portal-Felder, Preis-Matrix und Rechnungsbezug weiterhin konsistent?
- sind `created_by` / `updated_by` und Tenant-Scope intakt?

## 7. Eloquent-Startpunkte fuer typische Aufgaben

Wenn du neu im Code bist, starte meistens hier:

- [Project.php](/C:/xampp/htdocs/Translation-Office/backend/app/Models/Project.php)
  - Kernbeziehungen fuer Projektprozess
- [Customer.php](/C:/xampp/htdocs/Translation-Office/backend/app/Models/Customer.php)
  - CRM, Preislogik, Portalzugang
- [Invoice.php](/C:/xampp/htdocs/Translation-Office/backend/app/Models/Invoice.php)
  - Rechnungsstatus, Immutability, Audit, Dunning
- [Tenant.php](/C:/xampp/htdocs/Translation-Office/backend/app/Models/Tenant.php)
  - Mandantenbezug, Subscription-Anker

## 8. Schema-Quelle und Migration-Strategie

- Aktuelle Referenzbasis fuer frische Setups:
  - [mysql-schema.sql](/C:/xampp/htdocs/Translation-Office/backend/database/schema/mysql-schema.sql)
- Historische Migrationen wurden gesquasht.
- Neue Schema-Aenderungen kommen ab jetzt wieder als neue Migrationen in:
  - [database/migrations](/C:/xampp/htdocs/Translation-Office/backend/database/migrations)
- Kurzregel:
  - kleine, fachlich klare Migrationen schreiben
  - Tenant-Isolation immer mitdenken
  - bei starker Historienzunahme spaeter wieder bewusst dumpen und squashen

## 9. Offene konzeptionelle Beobachtungen

Diese Punkte sind keine Bugs, aber wichtig fuer das Verstaendnis:

- `projects.status` und `project_statuses` existieren parallel und koennen langfristig Konsolidierungsbedarf erzeugen
- `customers` verbindet klassische CRM-Daten mit Portalzugang in einer Tabelle
- `invoices` sind bewusst von Live-Kundendaten entkoppelt und arbeiten mit Snapshots
- die Datenbank kombiniert Produktdaten, SaaS-Abrechnung und technische Observability in einer gemeinsamen DB

## 10. Empfehlung fuer Folgearbeit

Wenn mehr Tiefe noetig ist, waeren die naechsten sinnvollen Dokumente:

1. Tabellen-Spickzettel mit wichtigen Spalten je Kerntabelle
2. ER-Diagramm fuer die fachlichen Hauptbeziehungen
3. Tenant- und Rollenfluss-Doku fuer Auth, Portal und Policies
