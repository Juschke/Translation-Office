en Look von Translator Office zu schärfen.🛠️ Technische Design-Spezifikation1. Color Tokens (CSS Variables)Für ein klares User-Interface nutzen wir hohe Kontraste für die Daten und das "Teal" für die Markenidentität.CSS:root {
  /* Brand Colors */
  --color-primary: #1B4D4F;    /* Deep Teal (Linke Blase) */
  --color-accent: #9BCB56;     /* Action Green (Rechte Blase) */
  
  /* Neutral Palette für Daten-Tabellen */
  --bg-app: #F4F7F6;           /* Leichtes Teal-Grau für den Hintergrund */
  --bg-card: #FFFFFF;
  --text-main: #1A1C1C;        /* Fast Schwarz für beste Lesbarkeit */
  --text-muted: #626B6A;       /* Für Metadaten (z.B. Zeitstempel) */
  --border-subtle: #D1D9D8;    /* Klare Trennlinien ohne zu knallen */
}
2. Layout & Spacing (8px Grid System)Ein Translation Management System ist oft datenlastig. Ein striktes Raster hilft, die Übersicht zu behalten.Paddings (Innerhalb von Elementen):p-sm: 8px (Buttons, kleine Inputs)p-md: 16px (Standard für Cards & Toolbars)p-lg: 24px (Haupt-Container)Margins (Abstände zwischen Modulen):m-md: 16pxm-lg: 32px (Abstand zwischen Header und Main Content)3. UI-Komponenten DefinitionKomponenteDefinitionTechnischer StyleButtons8px RadiusSolid --color-primary mit weißem Text.Data Cards12px RadiusBorder: 1px solid --border-subtle; kein Shadow (für Klarheit).Input Fields6px RadiusBackground: #FFFFFF; Focus-Border: --color-accent.HeaderStickyBackground: #FFFFFF; Border-Bottom: 2px solid --color-primary.4. Typography (Technische Hierarchie)Wir nutzen Montserrat für Headlines (da es nah an Oswald ist, aber technischer wirkt) und Inter für die Datenübersetzung.Headlines (H1, H2): Font-Weight: 700; Letter-Spacing: -0.02em; Color: --color-primary;Translation Text: Font-Family: 'Inter', sans-serif; Font-Weight: 400; Line-Height: 1.6;Code/Keys: Font-Family: 'JetBrains Mono', monospace; Background: #EDF2F1; 