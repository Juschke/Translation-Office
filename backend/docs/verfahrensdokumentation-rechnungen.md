# Verfahrensdokumentation Rechnungen Und Buchhaltungsnahe Belege

Stand: 8. April 2026
System: Translation Office
Geltungsbereich: Rechnungserstellung, E-Rechnung, Mahnung, Belegarchiv, Audit-Trail

## 1. Zweck

Diese Verfahrensdokumentation beschreibt den Soll-Prozess fuer die Erstellung, Ausstellung, Berichtigung, Archivierung und Pruefbarkeit von Rechnungen und angrenzenden Belegen im System Translation Office.

Sie dient als Grundlage fuer:

- Entwicklung
- interne Freigaben
- Steuerberatung
- Audit- und Pruefungsvorbereitung

## 2. Systemgrenzen

Im Scope dieser Dokumentation:

- Rechnungsentwuerfe
- ausgestellte Rechnungen
- Gutschriften / Storno-Belege
- Rechnungspositionen
- Mahnbelege und Mahnprotokolle
- ZUGFeRD-/XRechnung-Ausgabe
- Audit- und Aktivitaetsprotokolle
- Dateiablage von Rechnungs-PDF und XML

Nicht vollstaendig im Scope:

- externe Buchhaltungssysteme
- Banken / Zahlungsdienstleister
- Steuerberater- oder DATEV-Zielsysteme
- manuelle Verarbeitung ausserhalb des Systems

## 3. Verantwortlichkeiten

## 3.1 Fachliche Rollen

- `Sachbearbeitung`
  - erstellt und pflegt Rechnungsentwuerfe
- `Freigabeberechtigte Person`
  - prueft Pflichtangaben und stellt Rechnung aus
- `Buchhaltung`
  - bearbeitet Zahlstatus, Mahnwesen und Exporte
- `Administration`
  - verwaltet Stammdaten, Rechte, E-Mail- und Firmeneinstellungen

## 3.2 Technische Rollen

- `Entwicklung`
  - implementiert Regeln fuer Unveraenderbarkeit und Validierung
- `Betrieb / Hosting`
  - sichert Verfuegbarkeit, Backup und Wiederherstellung
- `Datenschutz / Compliance`
  - bewertet Aufbewahrung, Zugriff und Nachweisbarkeit

## 4. Stammdaten Als Voraussetzung

Vor Ausstellung einer Rechnung muessen mindestens korrekt gepflegt sein:

- Name und Anschrift des Leistenden
- Steuer- oder USt-Id-Daten des Leistenden, soweit erforderlich
- Name und Anschrift des Empfaengers
- Leistungsdatum oder Leistungszeitraum
- Waehrung, Netto, Steuer, Brutto
- Steuersachverhalt
- Zahlungsziel

Zusatz bei Sonderfaellen:

- Reverse-Charge-Hinweis
- Kleinunternehmer-Hinweis
- Leitweg-ID / Buyer Reference bei oeffentlichen Auftraggebern
- elektronische Kontaktangaben fuer E-Rechnung, soweit erforderlich

## 5. Prozessbeschreibung

## 5.1 Erstellung eines Rechnungsentwurfs

1. Ein Benutzer legt einen Rechnungsentwurf an.
2. Das System vergibt noch keine endgueltige ausgestellte Rechnung im Sinne eines unveraenderbaren Belegs.
3. Kundendaten, Projektbezug und Positionen werden vorbereitet.
4. Betrage werden intern centgenau gespeichert.
5. Der Status ist `draft`.

Regel:

- Entwuerfe duerfen bearbeitet und verworfen werden.
- Entwuerfe duerfen nicht als endgueltige Archivbelege behandelt werden.

## 5.2 Pruefung vor Ausstellung

Vor Ausstellung fuehrt das System einen fachlichen Pflichtcheck aus.

Zu pruefen sind mindestens:

- Pflichtangaben nach Steuerrecht
- konsistente Summen
- gueltiger Steuersachverhalt
- vollstaendige Adressdaten
- Vorliegen notwendiger E-Rechnungsdaten fuer den konkreten Fall

Wenn Pflichtangaben fehlen:

- die Ausstellung wird blockiert
- der Benutzer erhaelt eine klare Fehlermeldung

## 5.3 Ausstellung der Rechnung

1. Nach erfolgreicher Pruefung wird die Rechnung ausgestellt.
2. Das System setzt:
   - finalen Status
   - Ausstellungszeitpunkt
   - Sperrkennzeichen
3. Zum Ausstellungszeitpunkt werden fachlich relevante Daten als Snapshot gesichert.
4. Das System erzeugt die zugehoerigen Ausgabedateien:
   - PDF
   - XML bei E-Rechnungsfall
5. Das System erzeugt Audit-Eintraege.

Regel:

- Nach Ausstellung ist der Beleg inhaltlich nicht mehr frei editierbar.

## 5.4 Nummernvergabe

1. Rechnungsnummern werden tenantbezogen fortlaufend erzeugt.
2. Die Vergabe erfolgt transaktionsgeschuetzt.
3. Nummern duerfen nicht stillschweigend ueberschrieben werden.

Regel:

- die Nummernlogik muss nachvollziehbar und konsistent bleiben
- Sonderfaelle und Fehlversuche muessen pruefbar sein

## 5.5 Korrektur und Storno

1. Ausgestellte Rechnungen werden nicht geloescht.
2. Korrekturen erfolgen ueber einen Gegenbeleg.
3. Der Gegenbeleg referenziert den Ursprungsbeleg.
4. Original und Korrektur bleiben gemeinsam nachvollziehbar erhalten.

Regel:

- keine direkte inhaltliche Umschreibung des ausgestellten Originalbelegs

## 5.6 Zahlstatus und Mahnung

1. Zahlungen veraendern nur den Zahlungsstatus, nicht den historischen Inhalt des Belegs.
2. Mahnstufen werden als eigene Ereignisse protokolliert.
3. Mahnbelege und Mahntexte werden nachvollziehbar gespeichert.

## 5.7 Archivierung

Nach Ausstellung werden die Rechnungsdateien archiviert.

Soll-Regeln:

- Archivdateien duerfen nicht unbemerkt ersetzt werden
- pro Datei wird ein Hash gespeichert
- Datei und Metadaten bleiben zusammen pruefbar
- Lesbarkeit und Wiederherstellbarkeit muessen waehrend der Aufbewahrungsfrist gewaehrleistet sein

## 6. Datenhaltung

## 6.1 Primare Tabellen

- `invoices`
- `invoice_items`
- `invoice_audit_logs`
- `dunning_logs`
- `activity_log`

## 6.2 Datenklassen

- Stammdaten
- Snapshot-Daten
- Bewegungsdaten
- Audit-Daten
- Archivdateien

## 6.3 Unveraenderbare Daten

Nach Ausstellung gelten als fachlich eingefroren:

- Rechnungsempfaenger-Snapshot
- Leistender-Snapshot
- Positionsdaten
- Summen
- Steuersachverhalt
- Rechnungsnummer
- Referenzen auf Ursprungsbelege

## 7. Technische Kontrollen

## 7.1 Validierung

- serverseitige Validierung vor Ausstellung
- keine Ausstellung bei fehlenden Pflichtangaben

## 7.2 Sperrlogik

- ausgestellte Rechnungen sind gegen freie Bearbeitung gesperrt
- nur definierte Statusfelder duerfen sich in klaren Grenzen aendern

## 7.3 Audit-Trail

Zu protokollieren sind mindestens:

- Erstellung
- Ausstellung
- Statuswechsel
- Storno
- Mahnung
- Download / Export, falls fachlich erforderlich

## 7.4 Dateischutz

Soll-Zustand:

- Hash je erzeugter Datei
- Zeitstempel der Erzeugung
- versionierte oder unveraenderbare Ablage
- dokumentierter Restore-Prozess

## 8. Aufbewahrung

Fachliche Grundregel:

- Rechnungen und rechnungsnahe Belege muessen waehrend der gesetzlichen Fristen verfuegbar, lesbar und nachpruefbar bleiben.

Im System zu beruecksichtigen:

- keine fachlich unzulaessige Loeschung waehrend Aufbewahrungsfrist
- Trennung zwischen Soft Delete, Archivstatus und echter Loeschung
- Wiederherstellbarkeit von Dateien und Metadaten

## 9. Backup Und Wiederherstellung

Der Betrieb muss sicherstellen:

- regelmaessige Backups der Datenbank
- regelmaessige Backups der Archivdateien
- dokumentierte Restore-Tests
- Nachweis, dass Daten konsistent wiederhergestellt werden koennen

## 10. Prueferzugriff Und Nachweisfaehigkeit

Fuer Pruefungen sollte bereitgestellt werden koennen:

- Rechnungskopf und Positionen
- Audit-Historie
- Mahnverlauf
- Archivdateien
- Datei-Hashes
- Export in maschinell auswertbarer Form

## 11. Fehler- Und Ausnahmefaelle

Relevante Ausnahmefaelle:

- PDF-Erzeugung fehlgeschlagen
- XML-Erzeugung fehlgeschlagen
- Pflichtangaben fehlen
- Nummernvergabe kollidiert
- Archivdatei fehlt
- Hash stimmt nicht mit Datei ueberein

Soll-Regel:

- Fehler muessen protokolliert werden
- Ausstellung darf bei kritischen Compliance-Fehlern nicht als erfolgreich gelten

## 12. Aenderungsmanagement

Jede Aenderung an Rechnungslogik, Archivierung oder Export muss vor produktivem Einsatz geprueft werden auf:

- Pflichtangaben
- Unveraenderbarkeit
- Auditierbarkeit
- Exportfaehigkeit
- Rueckwaertskompatibilitaet archivierter Belege

## 13. Offene Punkte Im Aktuellen Systemstand

- Hash- und Integritaetsnachweis fuer PDF/XML fehlt noch
- harte Ausstellungssperre bei Pflichtfeldverstoessen muss noch konsequent umgesetzt werden
- vollstaendiger Gegenbeleg-Workflow fuer Storno muss noch abgesichert werden
- Query-Builder-Umgehungen der Sperrlogik muessen beseitigt werden
- Aufbewahrungs- und Loeschkonzept muss finalisiert werden

## 14. Freigabevermerk

Diese Fassung ist eine technische und fachliche Arbeitsgrundlage.

Sie ist noch keine abschliessend freigegebene Endfassung fuer Steuerpruefung oder Rechtsberatung und muss vor produktiver Compliance-Freigabe mit den tatsaechlich umgesetzten Kontrollen abgeglichen werden.
