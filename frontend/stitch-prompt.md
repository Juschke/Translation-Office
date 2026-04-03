# Stitch AI Designer - Project Details Page Prompt

## Überblick
Erstelle ein detailliertes UI-Design für eine **Project Details Seite** eines Translation Management Systems (TMS). Die Seite zeigt alle Projektinformationen mit intuitiver Navigation und Informationshierarchie.

---

## Layout-Struktur

### Hauptlayout: 70% / 30% Split
- **Linke Seite (70%)**: Hauptinhalte (Stammdaten, Kunde, Partner)
- **Rechte Seite (30%)**: Sticky Sidebar mit Meta-Informationen
- Responsive auf Mobile: Stacked Layout (100% Breite)

---

## Header-Bereich (Oben auf allen Seiten)

### Breadcrumb & Navigation
- Kategorie-Tabs: **Stammdaten | Dokumente | Kalkulation | Kommunikation | Historie**
- Aktives Tab sollte unterstrichen sein mit Brand-Farbe (Blau)
- Badge-Zähler neben jedem Tab: (3) Dokumente, (5) Kalkulationen, etc.

### Haupt-Buttons (Top-Right)
- **"Bearbeiten"** Button (Primary, Blau)
- **"Löschen"** Button (Destructive, Rot)
- **"Mehr Aktionen"** Dropdown (Secondary)

---

## LINKE SEITE (70%) - Hauptinhalte

### 1. STAMMDATEN Section (Collapsable)

**Header:**
- Titel: "Stammdaten"
- Chevron-Icon zum Expand/Collapse (offen standardmäßig)

**Inhalt (offen):**

#### Sprachpaar
```
Label: SPRACHPAAR
Content:
[🇩🇪 Deutsch] → [🇬🇧 English]
```
- Deutsche & englische Flaggen
- Weiß-hintergrund Badges mit Border

#### Auftragsdetails
```
BESCHREIBUNG
Website mit 45 Seiten übersetzen, inkl. SEO-Optimierung für englischen Markt

NOTIZEN
Bitte deutsche Formatierung & Maßeinheiten beibehalten. Kurze URLs ohne Umlaute.

DOKUMENTTYP
Webseite, PDF, Word-Dokument

OPTIONEN
[✓ Beglaubigt] [✓ Apostille] [Express]
```
- Grüne Badges für aktivierte Optionen
- Rote Badges für Express

#### Status & Lieferung
```
PROJEKT STATUS
[In Bearbeitung] (Blau-Badge)

VERSANDART
Per E-Mail
```

---

### 2. KUNDE & PARTNER - 2-Spaltig

#### KUNDE Card (Linke Spalte)
```
┌─────────────────────────────────┐
│ KUNDE          [✉] [✎]          │  ← Icons: E-Mail, Edit
├─────────────────────────────────┤
│ ID            Kunde-0042        │
│ NAME          Acme Corporation  │
│ E-MAIL        info@acme.de      │ (Link)
│ MOBIL         +49 160 123456    │ (Link)
│ TEL           +49 30 987654     │ (Link)
│ ─────────────────────────────── │
│ STRASSE       Hauptstr. 15      │
│ PLZ           10115             │
│ STADT         Berlin            │
│ LAND          Deutschland       │
│ ─────────────────────────────── │
│ [Wechseln] [⋯]                  │
└─────────────────────────────────┘
```

**Dropdown-Aktionen (⋯):**
- → Alle Details
- → E-Mail senden

---

#### PARTNER Card (Rechte Spalte)
```
┌─────────────────────────────────┐
│ PARTNER        [✉] [✎]          │
├─────────────────────────────────┤
│ ID            Partner-0156      │
│ NAME          Maria Schmidt     │
│ BEW.          ⭐⭐⭐⭐⭐ 4.8/5     │
│ SPRACH        [DE] [EN] [FR]    │
│ E-MAIL        maria@trans.de    │ (Link)
│ MOBIL         +49 170 234567    │ (Link)
│ TEL           +49 30 654321     │ (Link)
│ ─────────────────────────────── │
│ STRASSE       Lindauer Str. 22  │
│ PLZ           80336             │
│ STADT         München           │
│ LAND          Deutschland       │
│ ─────────────────────────────── │
│ SÄTZE                           │
│ Wort: 0,12€                     │
│ Zeile: 2,50€                    │
│ ─────────────────────────────── │
│ [Wechseln] [⋯]                  │
└─────────────────────────────────┘
```

**Dropdown-Aktionen (⋯):**
- → Alle Details
- → E-Mail senden

**Wenn kein Partner zugewiesen:**
```
Noch kein Partner zugewiesen
[Auswählen] Button
```

---

### Design-Details für Kunde & Partner Cards:

**Styling:**
- Weißer Hintergrund, 1px Grauer Border
- 20px Padding innen
- Grauer Text für Labels (Kleinkapitälchen, 8px, 500 weight)
- Dunkler Text für Werte (10px)
- Links in Blau (#2563EB)

**Label-Grid:**
- Label: 65px Breite (rechtsbündig)
- Value: Flexible Breite
- Gap: 8px
- Separator (horizontale Linie) zwischen Kontakt-Sektion und Adresse-Sektion

**Button-Reihe unten:**
- [Wechseln] = Primary Button, Blau, flex-1 (full width)
- [⋯] = Icon-Button, Border, Kleinkapitälchen, 12px
- Durchgehend 24px Gap zwischen Buttons

---

## RECHTE SIDEBAR (30%) - Meta-Informationen

### 1. Status Box
```
┌─────────────────────────────────┐
│ STATUS                          │
├─────────────────────────────────┤
│ [In Bearbeitung]                │
└─────────────────────────────────┘
```
- Farbige Badges je nach Status:
  - Entwurf: Grau
  - Angebot: Orange
  - In Bearbeitung: Blau
  - Abholbereit: Indigo
  - Geliefert: Grün
  - Rechnung: Lila
  - Abgeschlossen: Dunkelgrün
  - Storniert: Grau

---

### 2. Fortschritt Box
```
┌─────────────────────────────────┐
│ FORTSCHRITT                     │
├─────────────────────────────────┤
│ Dateien      3 / 5              │
│ ████████░░░░░░░░░░░░░░░░░░░░░  │ ← 60% gefüllt
│                                 │
└─────────────────────────────────┘
```
- Grauer Hintergrund-Balken
- Blauer Fortschritts-Balken (Brand-Farbe)
- Kleiner Text über & unter Balken
- Rounded Corners (border-radius: 8px)

---

### 3. Finanzen Box
```
┌─────────────────────────────────┐
│ FINANZEN                        │
├─────────────────────────────────┤
│ Geschätzt:       € 1.250,00     │
│ Rechnung:        ✓              │
│ Positionen:      5              │
│                                 │
└─────────────────────────────────┘
```
- 2-spaltig: Label links, Wert rechts
- Rechts-bündig für Werte
- Format: "€ 1.250,00" (deutsches Format mit Punkt als Tausender)

---

### 4. Weitere Info Box
```
┌─────────────────────────────────┐
│ WEITERE INFO                    │
├─────────────────────────────────┤
│ Termin:          10. Apr        │
│ Tage:            +3             │ ← Grün wenn positiv, Rot wenn negativ
│ Priorität:       Hoch           │
│ Nachrichten:     2              │
│                                 │
└─────────────────────────────────┘
```
- Tage-Anzeige:
  - Grün (#10B981) wenn positiv: "+3"
  - Rot (#DC2626) wenn überfällig: "-5"

---

### 5. Stammdaten-Links Box
```
┌─────────────────────────────────┐
│ STAMMDATEN                      │
├─────────────────────────────────┤
│ → Projekt bearbeiten            │ (Blau, Primary)
│ → Alle Kunden                   │ (Grau, Hover: Blau)
│ → Alle Partner                  │ (Grau, Hover: Blau)
│                                 │
└─────────────────────────────────┘
```
- Pfeil-Präfix (→)
- Text als Links, Hover zeigt Hintergrund-Farbe
- Schrift: Kleinkapitälchen, 11px, 500 weight

---

### Sidebar Styling:
- Alle Boxen: Weiß, 1px Border Grau, 16px Padding
- Border-radius: 4px
- Box-spacing: 12px vertikal
- **Sticky Position**: Sidebar scrollt mit, bleibt sichtbar
- **Responsive**: Auf Mobile unter Hauptcontent verschoben

---

## Weitere Tabs/Reiter (nicht in diesem Prompt detailliert, aber aufzählen)

### Tab: Dokumente
- Datei-Liste mit Upload
- Filter: Quelle / Ziel
- Masse-Aktionen

### Tab: Kalkulation
- Positionen-Tabelle
- Zahlungs-Historie
- Rechnung-Status

### Tab: Kommunikation
- Chat-Interface
- Nachrichten-Thread mit Kunde & Partner

### Tab: Historie
- Activity-Log aller Änderungen

---

## Farbpalette & Design-System

### Farben
- **Brand-Primary**: #3B82F6 (Blau) - Für Highlights, Buttons, Links
- **Hintergrund**: #F8FAFC (Sehr helles Grau)
- **Card-Hintergrund**: #FFFFFF (Weiß)
- **Text Primary**: #0F172A (Sehr dunkelblau/Schwarz)
- **Text Secondary**: #64748B (Mittleres Grau)
- **Text Tertiary**: #94A3B8 (Helleres Grau)
- **Borders**: #E2E8F0 (Hellgrau)
- **Hover-States**: #F1F5F9 (Sehr helles Grau)

**Status-Farben:**
- Info/Entwurf: #F1F5F9 (hellgrau)
- Orange (Angebot): #FED7AA
- Blau (In Bearbeitung): #DBEAFE
- Grün (Abgeschlossen): #D1FAE5
- Rot (Fehler): #FEE2E2

### Typography
- **Titel (H1)**: 24px, 700 weight, Dark Text
- **Untertitel (H3)**: 14px, 700 weight, Dark Text
- **Label**: 8px, 700 weight, UPPERCASE, Grau-Text
- **Body Text**: 10-12px, 400-500 weight
- **Links**: 10-12px, Blau, Hover: Underline

### Spacing
- Inner Padding Cards: 16-20px
- Gap zwischen Elementen: 12-16px
- Gap zwischen Spalten: 24px

---

## Interaktionen & Animations

### Hover-States
- Buttons: Dunkleres Blau, Kurz-Shadow
- Links: Unterline, Text-Farbe zu Brand-Primary
- Cards: Sehr leichte Shadow, 0.2s transition

### Expansions/Collapse
- Chevron dreht sich 180° bei Toggle
- Inhalte fade-in/fade-out (0.3s)
- Smooth Animation

### Dropdowns
- Erscheinen unterhalb des Buttons
- Floating-Fenster mit 8px Border-Radius
- Shadow: 0 10px 25px rgba(0,0,0,0.1)
- Optionen mit Hover-Highlight

---

## Responsive Verhalten

### Desktop (≥ 1024px)
- 70/30 Split Grid
- 2-spaltig Kunde/Partner nebeneinander
- Sidebar sticky

### Tablet (768px - 1023px)
- 60/40 Split oder 100% Stack
- Kunde/Partner noch nebeneinander möglich, aber enger
- Sidebar sticky oben

### Mobile (< 768px)
- 100% Breite
- Stack vertikal: Stammdaten → Kunde → Partner → Sidebar
- Alle Sections collapsable
- Buttons volle Breite
- No sticky Sidebar

---

## Beispiel-Datensatz (Komplette Beispielwerte)

```
PROJECT:
- ID: PJ-2026-0127
- Nummer: 001
- Name: Website Redesign - Englisch
- Beschreibung: Website mit 45 Seiten übersetzen, inkl. SEO-Optimierung für englischen Markt
- Notizen: Bitte deutsche Formatierung & Maßeinheiten beibehalten. Kurze URLs ohne Umlaute.
- Sprachenpaar: Deutsch → Englisch
- Status: In Bearbeitung
- Priorität: Hoch
- Termin: 10. April 2026
- Erstellt: 03.04.2026 10:30 von Max Müller
- Zuletzt aktualisiert: 07.04.2026 14:15 von Maria Schmidt

CUSTOMER:
- ID: KND-042
- Name: Acme Corporation GmbH
- Email: info@acme.de
- Mobil: +49 160 1234567
- Festnetz: +49 30 9876543
- Straße: Hauptstraße 15
- Hausnummer: (enthalten in Straße)
- PLZ: 10115
- Stadt: Berlin
- Land: Deutschland

PARTNER (TRANSLATOR):
- ID: TRN-156
- Name: Maria Schmidt
- Rating: 4.8/5 (48 Bewertungen)
- Sprachen: Deutsch, Englisch, Französisch
- Email: maria@translator.de
- Mobil: +49 170 2345678
- Festnetz: +49 30 6543210
- Straße: Lindauer Straße 22
- PLZ: 80336
- Stadt: München
- Land: Deutschland
- Wort-Satz: € 0,12 pro Wort
- Zeilen-Satz: € 2,50 pro Zeile

FINANCIAL:
- Geschätzte Kosten: € 1.250,00
- Berechnete Kosten: € 1.200,00
- Rechnungsbetrag: € 1.200,00
- Marge: € 50,00 (4%)
- Positionen: 5
- Rechnungsnummer: #INV-2026-0127
- Status: Offen

FILES:
- Source Files: 3 (PDF, Word, Excel)
- Target Files: 3 (PDF, Word, Excel)
- Total Size: 2.5 MB
- Fortschritt: 3/3 Dateien = 100%

MESSAGES:
- Nachrichten-Count: 2
- Letzte Nachricht: Gestern von Maria Schmidt

OTHER:
- Tage bis Deadline: +3 (Grün)
- Versandart: Per E-Mail
- Dokument-Typen: Webseite, PDF, Word
- Optionen: ✓ Beglaubigt, ✓ Apostille, Express
```

---

## Zusätzliche Details

### Accessibility
- Alt-Text auf Flaggen-Icons
- ARIA-Labels auf Buttons
- Proper Kontrastierung (WCAG AA minimum)
- Keyboard Navigation möglich

### Performance
- Lazy-Load für Footer-Sektion
- Bilder optimiert
- No Blocking JavaScript

### Konsistenz
- Alle Cards mit gleichem Styling
- Konsistente Icon-Größen
- Einheitliche Spacing-Regeln

---

## Zusätzliche Hinweise für Designer

1. **Nicht included**: Tabs-Inhalte (Dokumente, Kalkulation, etc.) - nur zeigen dass Tabs existieren
2. **Focus**: Stammdaten, Kunde, Partner Cards und Sidebar
3. **Interaktive Elemente**: Buttons, Dropdowns, Expand/Collapse sollten gehighlightet werden
4. **Dunkelmodus**: Optional für zukünftige Iteration (nicht für diese Version erforderlich)
5. **Print-freundlich**: Optional - könnten Print-Styles hinzugefügt werden

---

## Dateiformat
- Format: Modern Web Design (Figma/Stitch Style)
- Breakpoints: Mobile (375px), Tablet (768px), Desktop (1440px)
- Grid: 12-Column System empfohlen
- Components: Reusable Button, Card, Badge, Input, Dropdown

---

**End of Prompt - Ready for Stitch AI Designer Implementation**
