PROJEKTSPEZIFIKATION: TRANSLATER OFFICE (TMS)
Version: 1.0 (Final)
Technologie: Laravel 10+, React 18, MySQL (XAMPP), TailwindCSS
Architektur: Multi-Tenant SaaS (Single Database, Tenant-Scoped)

1. Systemarchitektur & Mandantenfähigkeit
Das System ist darauf ausgelegt, mehrere Übersetzungsbüros (Mandanten) auf einer Installation zu hosten, wobei Daten strikt getrennt sind.

1.1 Datenbank-Konzept
Single-Database-Approach: Alle Mandanten teilen sich eine Datenbank.

Tenant-Isolation: Jede Tabelle, die mandantenspezifische Daten enthält (Projects, Customers, Invoices, Settings), besitzt eine Spalte tenant_id.

Global Scope (Laravel): Ein Trait BelongsToTenant wird in den Models implementiert, der automatisch WHERE tenant_id = current_tenant an jede Query anhängt.

1.2 Tech-Stack (Lokal auf XAMPP)
Server: Apache (via XAMPP).

Database: MySQL / MariaDB.

Backend: Laravel (als reine API mit Sanctum Auth).

Frontend: React (Single Page Application via Vite).

State Management: React Query (TanStack Query) oder Zustand für Server-State Synchronisation.

2. Datenmodelle (ERD) & Stammdaten
Hier werden die Datenbankstrukturen definiert, inklusive der neu angeforderten Stammdatenverwaltung.

2.1 Mandant & Firmen-Stammdaten (tenants & tenant_settings)
Jedes Büro verwaltet seine eigene Identität.

Felder: id, company_name, legal_form (GmbH, Einzelunternehmer), address_street, address_zip, address_city, tax_id (Steuernummer), vat_id (USt-IdNr.), bank_name, iban, bic, logo_path, website, primary_color (für Branding).

SMTP-Config (JSON): mail_host, mail_port, mail_username, mail_password (verschlüsselt), mail_encryption.

2.2 Benutzer & Rollen (users)
Benutzer gehören zu einem Mandanten.

Felder: id, tenant_id, firstname, lastname, email, password_hash, role (Admin, Project Manager, Accountant, Freelancer_Access), status (active/inactive), last_login.

Audit: Jeder Login wird protokolliert.

2.3 Sprachen-Stammdaten (languages)
Zentraler Katalog für alle verfügbaren Sprachen im System.

Felder: id, tenant_id, iso_code (z.B. 'de-DE', 'en-US'), name_internal ('Deutsch'), name_native ('Deutsch'), flag_icon (SVG-Code oder Pfad), is_source_allowed (bool), is_target_allowed (bool), status (active/archived).

2.4 Preis-Matrix & Kalkulation (price_matrices)
Hier wird die Logik für die automatische Angebotserstellung hinterlegt.

Felder: id, tenant_id, source_lang_id, target_lang_id, currency (EUR, USD).

Preise:

price_per_word: Preis pro Wort (z.B. 0.14).

price_per_line: Preis pro Normzeile (55 Anschläge, z.B. 1.20).

minimum_charge: Mindestauftragswert (z.B. 30.00).

hourly_rate: Stundensatz für Lektorat/DTP.

Logik: Das System prüft beim Projekt: Welches Sprachpaar? Welche Abrechnungsart (Wort/Zeile)? -> Wählt den passenden Satz.

2.5 Dokumentenarten (document_types)
Stammdaten für standardisierte Urkundenübersetzungen.

Felder: id, tenant_id, name (z.B. 'Geburtsurkunde', 'Abiturzeugnis'), default_price (Pauschalpreis, optional), vat_rate (z.B. 19% oder 0% für Kleinunternehmer), template_file (Pfad zu einer Word-Vorlage für dieses Dokument).

2.6 Layouts & Vorlagen (templates)
Verwaltung des visuellen Outputs.

Typen: 'invoice', 'offer', 'email_signature', 'reminder'.

Felder: id, tenant_id, type, name, content_html (HTML-Code mit Platzhaltern wie {{customer_name}}), css_styles.

3. Funktionale Module (Features)
3.1 Authentifizierung & Sicherheit
Login: E-Mail/Passwort via Laravel Sanctum (SPA Cookie Auth).

2FA (Optional): Vorbereitung für Zwei-Faktor-Authentifizierung.

Passwort-Policies: Erzwingen von starken Passwörtern.

3.2 Erweitertes Projektmanagement
Wizard:

Projektdaten & Auswahl Dokumentenart (zieht ggf. Pauschalpreis).

Kunde (CRM-Suche oder Neuanlage).

Upload & Analyse: Upload der Datei -> Backend zählt Wörter/Zeichen (Normzeilen-Berechnung: Zeichen / 55) -> Vorschlag Preis.

Status-Workflow: Anfrage -> Kalkulation -> Angebot -> Beauftragt -> In Bearbeitung -> Lektorat -> Geliefert -> Abgerechnet.

3.3 Inbox, E-Mail & Kalender
E-Mail-Engine: Senden von Mails (Angebote, Rechnungen) über die in den Stammdaten hinterlegten SMTP-Settings des Mandanten.

Vorlagen: Auswahl der E-Mail-Vorlage beim Senden ("Sehr geehrter Herr {{lastname}}...").

Kalender: React FullCalendar Integration. Zeigt Deadlines (Rot) und Zahlungsziele (Grün).

3.4 Finanzmodul & E-Rechnung
Rechnungserstellung: Generiert PDF basierend auf dem HTML-Layout (templates).

XRechnung / ZUGFeRD: Laravel generiert im Hintergrund eine XML-Datei (gemäß EN 16931 Standard) und bettet diese in das PDF ein oder hängt sie an. Dies ist für B2G (Behörden) verpflichtend.

Mahnwesen: Automatische Erkennung überfälliger Rechnungen und Generierung von Mahn-Mails.

3.5 Audit Logging (DSGVO & Sicherheit)
Modell: audit_logs (id, tenant_id, user_id, action, model_type, model_id, old_values, new_values, ip_address, timestamp).

Trigger: Jedes create, update, delete Event im Backend schreibt automatisch einen Log-Eintrag.

Viewer: Nur Admins können das Protokoll einsehen (z.B. "Wer hat den Wortpreis von Kunde X geändert?").

3.6 Portale (Kunden & Partner)
Separate Logins: Kunden sehen nur ihre Projekte. Partner sehen zugewiesene Jobs.

Funktion: Sichere Dateiübertragung (keine E-Mail-Anhänge) zur DSGVO-Compliance.

4. API Endpunkte (Spezifikation)
Hier eine Auswahl der wichtigsten API-Routen für Laravel (routes/api.php):

Stammdaten (Settings)
GET /api/settings/company – Lädt Firmendaten.

PUT /api/settings/company – Speichert Firmendaten/SMTP.

GET /api/settings/languages – Liste aller Sprachen.

POST /api/settings/languages – Neue Sprache anlegen.

GET /api/settings/prices – Lädt Preismatrix.

GET /api/settings/document-types – Liste Urkundenarten.

PUT /api/settings/templates/{type} – Update HTML-Layout für Rechnungen/Mails.

Operativ
POST /api/projects/analyze – Datei-Upload & Wortzählung/Normzeilen-Calc.

GET /api/audit-logs – Abruf der Systemprotokolle (Admin only).

POST /api/invoices/{id}/send – Versendet Rechnung per Mail (nutzt Template).

GET /api/invoices/{id}/download – Generiert ZUGFeRD PDF.

5. UI/UX Struktur (Frontend Views)
Die React-App wird in folgende Hauptbereiche unterteilt:

Auth Layout: Login, Register, Forgot Password.

App Layout: Sidebar (links), Topbar (User, Notifs), Main Content.

Views:

Dashboard: Widgets & Charts.

Projekte: Kanban-Board oder Listenansicht.

Kunden (CRM): Detailansicht mit Historie und spezifischen Preisen (Kunde kann abweichende Preise zur Standardmatrix haben).

Postfach: Integrierte E-Mail-Ansicht (Nachrichtenverlauf pro Projekt).

Finanzen: Rechnungsliste, Offene Posten, DATEV-Export Button.

Einstellungen (Stammdaten):

Tab "Firma": Logo Upload, Adressdaten, Bank.

Tab "System": Benutzerverwaltung, Audit Log.

Tab "Kalkulation": Sprachen, Währungen, Preismatrix, Dokumentenarten.

Tab "Vorlagen": Editor für Rechnungslayouts (HTML) und E-Mail-Texte.

6. Überfunktionale Anforderungen (NFR)
Performance: API-Antwortzeiten < 200ms. Nutzung von Caching (Redis) für Stammdaten (Sprachen, Settings).

Sicherheit:

Verschlüsselung der SMTP-Passwörter in der DB.

CSRF Protection (durch Sanctum).

Rate Limiting (Schutz vor Brute Force auf Login).

DSGVO (GDPR):

"Privacy by Design": Mandantentrennung.

Löschkonzept: Funktion "Kunde anonymisieren", die personenbezogene Daten entfernt, aber Finanzdaten für 10 Jahre behält (Aufbewahrungspflicht).

Skalierbarkeit: Der Code muss so geschrieben sein, dass er später auf Docker/Kubernetes laufen kann (Trennung von Code und State/Uploads).

7. Nächste Schritte zur Umsetzung (Action Plan)
Laravel Setup:

Neues Projekt: composer create-project laravel/laravel tms-backend.

DB Config in .env (XAMPP MySQL).

Migrationen erstellen für alle oben genannten Modelle.

Backend Logic:

Implementierung des TenantScope.

Einrichten der Stammdaten-Controller.

Implementierung der Wortzählungs-Logik (z.B. simple Text-Extraktion aus DOCX/PDF).

Frontend Setup:

React mit Vite installieren.

Router Struktur anlegen (/settings/company, /settings/prices usw.).

Formulare bauen, um die API-Daten zu konsumieren.

Dies ist die vollständige Spezifikation. Du kannst diesen Text nun nehmen und als Dokumentation in deinem Projektordner ablegen oder als direkten Prompt für KI-Coding-Assistenten verwenden, um Modul für Modul zu generieren.