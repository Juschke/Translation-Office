# Datenmodelle - Translation Office Management System

Dieses Dokument beschreibt detailliert die Datenmodelle für das Backend, basierend auf den Anforderungen des Frontends.

## 0. Mandanten / Firma (Tenants)
Stammdaten des Rechnungsstellers (Büro).

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Eindeutige ID |
| `company_name` | String | Handelsname des Büros (BT-27) |
| `legal_form` | String | Rechtsform (z.B. GmbH, Einzelunternehmer) (BT-27) |
| `domain` | String | Subdomain für Login |
| `address_street` | String | Straße (BT-35) |
| `address_house_no` | String | Hausnummer (BT-35) |
| `address_zip` | String | Postleitzahl (BT-38) |
| `address_city` | String | Stadt (BT-37) |
| `address_country` | String | Land (Standard: DE) (BT-40) |
| `tax_number` | String | Steuernummer (Finanzamt) (BT-31) |
| `vat_id` | String | Umsatzsteuer-ID (USt-IdNr.) (BT-31) |
| `bank_name` | String | Name der Bank |
| `bank_iban` | String | IBAN (BT-84) |
| `bank_bic` | String | BIC |
| `status` | String | `active`, `inactive` |

---

## 1. Kunden (Customers)
Verwaltet die Stammdaten der Auftraggeber.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Eindeutige ID |
| `tenant_id` | ForeignID | Bezug zum Mandanten |
| `type` | Enum | `private` (Privat), `company` (Firma), `authority` (Behörde) |
| `company_name` | String | Name der Firma/Behörde (erforderlich bei Typ company/authority) |
| `legal_form` | String | Rechtsform (BT-44) |
| `salutation` | String | Anrede (Herr, Frau, Dr., Prof.) |
| `first_name` | String | Vorname |
| `last_name` | String | Nachname (Pflichtfeld) |
| `email` | String | Primäre E-Mail |
| `additional_emails` | JSON | Liste weiterer E-Mail-Adressen |
| `phone` | String | Primäre Telefonnummer |
| `additional_phones` | JSON | Liste weiterer Telefonnummern |
| `address_street` | String | Straße (BT-50) |
| `address_house_no` | String | Hausnummer (BT-50) |
| `address_zip` | String | Postleitzahl (BT-53) |
| `address_city` | String | Stadt (BT-52) |
| `address_country` | String | Land (Standard: DE) (BT-55) |
| `leitweg_id` | String | Leitweg-ID für Behörden (BT-10) |
| `notes` | Text | Interne Notizen |
| `price_matrix_id` | ForeignID | Optionale Verknüpfung zu einer Preismatrix |
| `status` | String | `active`, `inactive`, `deleted` |

---

## 2. Partner / Übersetzer (Partners)
Dienstleister, die Projekte bearbeiten.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Eindeutige ID |
| `tenant_id` | ForeignID | Bezug zum Mandanten |
| `type` | Enum | `translator`, `interpreter`, `trans_interp`, `agency` |
| `salutation` | String | Anrede |
| `first_name` | String | Vorname |
| `last_name` | String | Nachname |
| `company` | String | Firmenname (bei Agenturen) |
| `email` | String | Primäre E-Mail |
| `additional_emails` | JSON | Liste weiterer E-Mails |
| `phone` | String | Primäre Telefonnummer |
| `additional_phones` | JSON | Liste weiterer Nummern |
| `languages` | JSON | Liste der aktiven Sprachpaare/Sprachen (IDs oder Codes) |
| `domains` | JSON | Fachgebiete (legal, tech, med, etc.) |
| `software` | String | CAT-Tools & Software-Kenntnisse |
| `address_street` | String | Straße |
| `address_house_no` | String | Hausnummer |
| `address_zip` | String | PLZ |
| `address_city` | String | Stadt |
| `bank_name` | String | Name der Bank |
| `bic` | String | BIC |
| `iban` | String | IBAN |
| `tax_id` | String | USt-IdNr. / Steuer-ID |
| `payment_terms` | Integer | Zahlungsziel in Tagen |
| `price_mode` | Enum | `per_unit`, `flat`, `matrix` |
| `unit_rates` | JSON | `{word: 0.08, line: 1.20, hour: 55.00}` |
| `flat_rates` | JSON | `{minimum: 45.00, cert: 5.00}` |
| `status` | Enum | `available`, `busy`, `vacation`, `blacklisted`, `deleted` |
| `rating` | Integer | 1 bis 5 Sterne |
| `notes` | Text | Interne Anmerkungen |

---

## 3. Projekte (Projects)
Zentrale Steuerung eines Übersetzungsauftrags.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Interne ID |
| `project_number` | String | Sichtbare Nummer (z.B. P-2024-1001) |
| `tenant_id` | ForeignID | Bezug zum Mandanten |
| `customer_id` | ForeignID | Bezug zum Kunden |
| `partner_id` | ForeignID | Bez. zum zugewiesenen Partner (Übersetzer) |
| `project_name` | String | Titel des Projekts |
| `source_lang_id` | ForeignID | Ausgangssprache |
| `target_lang_id` | ForeignID | Zielsprache |
| `status` | Enum | `request`, `calculation`, `offer`, `ordered`, `in_progress`, `review`, `delivered`, `invoiced`, `paid`, `archived`, `deleted` |
| `priority` | Enum | `low`, `medium`, `high` |
| `deadline` | DateTime | Liefertermin |
| `is_certified` | Boolean | Beglaubigt? |
| `has_apostille` | Boolean | Apostille enthalten? |
| `is_express` | Boolean | Express-Auftrag? |
| `classification` | Boolean | Führerschein-Klassifizierung? |
| `copies_count` | Integer | Anzahl der Kopien |
| `copy_price` | Decimal | Preis pro Kopie |
| `price_net` | Decimal | Gesamtnettopreis (Summe Positionen + Optionen) |
| `partner_cost_net` | Decimal | Kosten für den Partner (Netto) |
| `down_payment` | Decimal | Anzahlung |
| `notes` | Text | Projektnotizen |
| `document_type_id` | ForeignID | Primäre Dokumentenart |
| `additional_doc_types` | JSON | Weitere Dokumentenarten |

---

## 4. Projekt-Positionen (ProjectPositions)
Detaillierte Aufstellung der Leistungen innerhalb eines Projekts.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | ID |
| `project_id` | ForeignID | Zugehörigkeit zum Projekt |
| `description` | String | Bezeichnung der Leistung |
| `amount` | Decimal | Menge (z.B. 250) |
| `unit` | String | Einheit (Wörter, Zeilen, Stunden, Pauschal) |
| `quantity` | Decimal | Multiplikator (Standard: 1) |
| `partner_rate` | Decimal | Satz für den Partner |
| `partner_mode` | Enum | `unit` (pro Einheit) oder `flat` (Pauschal) |
| `partner_total` | Decimal | Berechnete Partnerkosten für diese Position |
| `customer_rate` | Decimal | Satz für den Kunden (BT-146) |
| `customer_mode` | Enum | `unit` oder `flat` |
| `customer_total` | Decimal | Berechneter Kundenpreis für diese Position |
| `tax_rate` | Decimal | Steuersatz pro Position (BT-152) |
| `margin_type` | Enum | `markup` (Aufschlag), `discount` (Rabatt) |
| `margin_percent` | Decimal | Prozentsatz der Marge |

---

## 5. Projekt-Dateien (ProjectFiles)
Hochgeladene Dokumente zu einem Projekt.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | ID |
| `project_id` | ForeignID | Zugehörigkeit zum Projekt |
| `file_name` | String | Originaler Dateiname |
| `file_path` | String | Speicherpfad |
| `file_size` | Integer | Größe in Bytes |
| `word_count` | Integer | Analysierte Wortzahl |
| `mime_type` | String | Dateityp |
| `type` | Enum | `source` (Quelltext), `target` (Übersetzung), `reference` (Referenz) |

---

## 6. Rechnungen (Invoices)
Finanzielle Abwicklung.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | ID |
| `invoice_number` | String | Rechnungsnummer (z.B. RE-2024-0001) |
| `project_id` | ForeignID | Bezug zum Projekt |
| `customer_id` | ForeignID | Bezug zum Kunden (für Stammdaten-Snapshot) |
| `date` | Date | Rechnungsdatum (BT-2) |
| `due_date` | Date | Fälligkeitsdatum (BT-9) |
| `delivery_date` | Date | Lieferdatum (BT-72) |
| `service_period_start` | Date | Abrechnungszeitraum Start (BT-73) |
| `service_period_end` | Date | Abrechnungszeitraum Ende (BT-74) |
| `amount_net` | Decimal | Nettobetrag (BT-109) |
| `tax_rate` | Decimal | Steuersatz (z.B. 19.00) (BT-118/152) |
| `amount_tax` | Decimal | Steuerbetrag (BT-110) |
| `amount_gross` | Decimal | Bruttobetrag (BT-112) |
| `currency` | String | Währung (BT-5) (Standard: EUR) |
| `payment_method` | String | Zahlungsart (BT-81, z.B. 30 für Überweisung) |
| `status` | Enum | `pending`, `paid`, `overdue`, `deleted` |
| `pdf_path` | String | Pfad zur generierten PDF |
