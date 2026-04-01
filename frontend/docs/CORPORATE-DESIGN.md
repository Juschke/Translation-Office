# Corporate Design

## 1. Designcharakter

Translator Office verwendet eine Business-UI fuer operative Facharbeit. Die Oberflaeche soll nicht wie ein generisches Startup-Admin wirken, sondern wie ein digitales Produktionswerkzeug fuer Uebersetzungsprojekte, Termine, Dokumente und Rechnungen.

Die aktuelle Designsprache ist ein Hybrid aus:

- moderner SPA-Struktur mit klaren Karten, Split Views und sanften Interaktionen
- klassischer Business-Software-Anmutung in Tabellen, Toolbars, Buttons und Statuslogik
- sachlicher Farbpalette mit hoher Lesbarkeit und vertrauensstiftendem Teal-Fokus

Das Designversprechen lautet:

- professionell
- kontrolliert
- effizient
- belastbar
- datenstark

## 2. Markenpersoenlichkeit

Die Marke wirkt:

- ruhig statt laut
- kompetent statt dekorativ
- hilfreich statt verspielt
- strukturiert statt experimentell
- hochwertig durch Konsequenz, nicht durch Effekthascherei

Fuer neue UI-Arbeit bedeutet das:

- keine trendgetriebenen Farbexperimente
- keine weichen Consumer-Patterns, wenn sie Produktivarbeit ausbremsen
- kein visuelles Chaos durch zu viele Sonderkomponenten
- keine uebermaessige Animation

## 3. Farbpalette

### Primaere Markenfarben

| Token | Wert | Rolle |
|---|---|---|
| Brand Primary | `#1B4D4F` | Hauptmarke, Navigation, Primaeraktionen, aktive Zustaende |
| Brand Accent | `#9BCB56` | Aktionsgruen fuer positive Aktivierung, sparsam einsetzen |

### Neutrale Arbeitsfarben

| Token | Wert | Rolle |
|---|---|---|
| App Background | `#F4F7F6` | Hauptflaeche der Anwendung |
| Card Background | `#FFFFFF` | Karten, Tabellen, Dialoge, Formulare |
| Text Main | `#1A1C1C` | Primaertext |
| Text Muted | `#626B6A` | Sekundaertext, Hilfstexte, Metainfos |
| Border Subtle | `#D1D9D8` | Flaechentrennung, Input-Rahmen, Panelgrenzen |

### Semantische Farben

| Bedeutung | Typischer Einsatz |
|---|---|
| Gruen | Erfolg, abgeschlossen, bezahlt, bestaetigt |
| Blau | in Bearbeitung, Information, datenbezogene Aktivitaet |
| Orange / Amber | Warnung, Fristen, Angebot, Mahnstufe |
| Rot | Fehler, gefaehrliche Aktion, Ueberfaelligkeit, Loeschen |
| Slate / Grau | Archiv, Neutralstatus, Metaebene |

### Farbregeln

- Brand Primary ist immer fuehrend, nicht Akzentfarbe.
- Akzentgruen wird nur fuer positive oder aktivierende Momente genutzt.
- Semantische Farben duerfen nicht dekorativ vermischt werden.
- Tabellen und Arbeitsflaechen bleiben neutral, damit Statusfarben wirken koennen.
- Zu dunkle Flaechen ausserhalb der Hauptnavigation vermeiden.

## 4. Typografie

| Einsatz | Schrift |
|---|---|
| Standard-UI | Inter |
| Headings und Markenwirkung | Montserrat |
| technische Werte, IDs, Codes | JetBrains Mono |

### Typografische Hierarchie

- Seitenh1: klar, knapp, ruhig, nicht heroisch
- Abschnittstitel: funktional, beschreibend
- Tabellenkoepfe: klein, fett, uppercase oder semi-uppercase
- Metadaten: klein, neutral, oft in Slate-Ton
- Kennziffern: tabellarisch, gut ausrichtbar, deutlich lesbar

### Sprachstil der UI

- kurz
- eindeutig
- handlungsorientiert
- fachlich, aber nicht juristisch
- deutsch als Hauptsystemsprache mit englischer Zweitsprache

## 5. Formensprache

### Radius

Es existieren zwei bewusst unterschiedliche Radieniveaus:

- kleine Business-Radien fuer Tabellen, Buttons, Inputs und harte Arbeitsmodule
- weichere Radien bei KPI-Karten und Auth-Flaechen

Regel:

- arbeitsnahe, datenlastige Elemente bleiben eher kantig
- zusammenfassende, orientierende oder onboardingnahe Elemente duerfen weicher sein

### Schatten

Schatten sind funktional, nicht dramatisch:

- leichte Card-Schatten fuer Abhebung vom App-Hintergrund
- staerkere Schatten fuer Dropdowns, Menues und Modals
- inset/highlight-Schatten fuer skeuomorphe Buttons und Toolbars

## 6. Layoutsystem

### Grundaufbau

Die Anwendung folgt einem dreistufigen Shell-Modell:

1. obere Hauptnavigation auf dunklem Teal
2. Workspace-Tab-Leiste auf weissem Untergrund
3. scrollbarer Inhaltsbereich auf hellem App-Hintergrund

### Layoutregeln

- globale Navigation bleibt immer sichtbar
- Inhalte scrollen im Main-Bereich, nicht die Gesamtseite
- Arbeitsseiten starten mit einem kompakten Header
- KPIs stehen direkt unter dem Header, wenn sie der Priorisierung dienen
- Tabellen und Split Views sind Vollwert-Arbeitsflaechen und erhalten ausreichend Hoehe

### Breitenlogik

- Standardseiten: grosszuegige Innenabstaende fuer Lesbarkeit
- Detailseiten: oft zentrierte Maximalbreiten
- datenlastige Oberflaechen: breite Panels, oft bis `1600px` oder `1800px`

## 7. Kernmuster der Oberflaeche

### Hauptnavigation

- dunkler Teal-Balken
- kompakte Hoehe
- klare Bereichsreihenfolge
- aktive Links ueber helle Unterkante
- Status-Badges direkt im Navigationskontext

### Workspace Tabs

- parallele Detailkontexte offenhalten
- aktive Tabs dezent hervorheben
- Dirty-State nur als kleiner Punkt
- Globalmenu fuer "Alle schliessen" und "Andere schliessen" beibehalten

### Seitenkopf

- Seitenname links
- Unterzeile als Kontext
- Primaeraktion rechts
- Sekundaeraktionen daneben

### KPI-Karten

- weisse Karte
- leicht weicher Radius
- kleines Icon mit farbiger Kreisflaeche
- grosser Zahlenwert
- optionale Trend- oder Subzeile

### Datentabellen

- klassisch-businessartige Header mit Verlauf
- kleine, dichte Zeilen
- Zebra-Muster
- klare Spaltenraster
- konfigurierbare Spaltensichtbarkeit
- Bulk-Actions und Filterflaechen

### Filterleisten und Toolbars

- graue Gradientflaeche
- Suchfeld rechts
- Filtertoggle mit Counter
- Exporte als Dropdown

### Buttons

- Primary: Teal-Gradient
- Secondary: neutrales Grau
- Destructive: Rot-Gradient
- Success: Gruen-Gradient
- Warning: Amber-Gradient
- Outline/Ghost fuer leichte Nebenhandlungen

### Formulare

- weisser Hintergrund
- feine Graurahmen
- Teal-Focus
- dichte vertikale Rhythmen
- direkte Beschriftung oberhalb des Feldes

### Status-Badges

- Projektstatus textlich und farblich klar
- Archiv und Trash neutral bzw. rot
- Erfolg nie ohne Text

### Detailseiten-Tabs

- klarer aktiver Unterstrich
- kleine Zaehler an datei- oder nachrichtenbezogenen Reitern
- mobile Umschaltung ueber Overlay-Menue

### Modals

- schnelle Bearbeitung statt kompletter Workflow
- bestaetigende Modals kurz halten
- komplexe Modals klar gliedern

### Split Views

- linke Auswahl oder Liste
- rechte Detailansicht
- klare Border-Trennung

### Kalender

- weisse Eventkarten mit linker Farbkante
- typbezogene Farbcodierung
- kompakte Eventinhalte
- rechte Seitenleiste fuer Planungskontext

### Reports

- weisse Chart-Panels
- sachliche Farbskala
- KPI-Block oben
- Datumsfilter prominent im Header

### Auth

- zweigeteilter Screen
- Hero links
- Formularpanel rechts
- derzeit noch mit Platzhalterbild im Hero

## 8. Spacing und Dichte

Das Produkt arbeitet mit mittlerer bis hoher Informationsdichte.

- Listen und Tabellen bleiben kompakt.
- Uebersichten erhalten mehr Luft als Editiermasken.
- Header und Aktionsleisten haben klare Trennung vom Inhalt.
- Weitraeumige White-Space-Layouts vermeiden, wenn die Seite Arbeitscharakter hat.

## 9. Bewegung und Mikrointeraktion

- kurze Fade-Ins
- Slide-Up fuer Menues und Dropdowns
- kleine Hover-Reaktionen
- Spinner fuer Hintergrundaktualisierungen

Regel:

- maximal 100 bis 300 ms
- keine grossen Show-Animationen

## 10. Responsives Verhalten

- Desktop ist das Primaermedium.
- Mobile und Tablet bleiben vollwertig nutzbar.
- Buttonlabels werden auf kleinen Screens verkuerzt.
- Navigation wechselt auf Burger-Menue.
- breite Tabellen brauchen eine kontrollierte Scrollstrategie.

## 11. Accessibility-Grundsaetze

- Focus-Zustaende immer sichtbar
- Texte nicht nur ueber Farbe codieren
- Icon-only-Buttons brauchen Labels oder Titles
- Hover-only-Informationen nie als einzige Informationsquelle
- kleine Schrift nur fuer Metaebene, nicht fuer Geschaeftskritisches

## 12. Do and Don't

### Do

- Teal als Fuehrungsfarbe konsequent nutzen
- neutrale Flaechen fuer datenlastige Bereiche priorisieren
- bestehende Tabellen- und Buttonlogik wiederverwenden
- Arbeitskontexte ueber Badges, Status und Zaehler sichtbar machen
- Business-Klarheit vor visueller Originalitaet stellen

### Don't

- keine ploetzlichen Dark-Mode-Inseln einfuehren
- keine violette Standard-SaaS-Aesthetik hineinmischen
- keine weichgespuelten Consumer-Controls in Kernarbeitsflaechen
- keine uebergrossen Hero-Elemente in operativen Listenansichten
- Tabellen nicht in card-basierte Marketing-Layouts umformen
