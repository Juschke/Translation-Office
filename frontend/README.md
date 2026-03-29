# Translator Office - Frontend (React)

## Überblick
Dieses Frontend ist eine React-SPA (Single Page Application), die mit **Vite** gebaut wurde. Es nutzt **Tailwind CSS** für das Styling und **TanStack Query** (React Query) für das State-Management und API-Aufrufe.

## Architektur & Coding-Guidelines (Für Entwickler & KI)

### 1. Komponentengröße & Struktur
*   **Maximal 300 Zeilen**: Komponenten, die größer als 300 Zeilen sind, müssen in kleinere Teilkomponenten aufgeteilt werden.
*   **Seiten-Struktur**: Komplexe Seiten (z.B. `Inbox`, `ProjectDetail`) sollten einen eigenen Ordner in `src/pages/[PageName]/` haben, mit:
    *   `index.tsx`: Die Hauptseite.
    *   `components/`: Seiten-spezifische UI-Komponenten.
    *   `hooks/`: Seiten-spezifische Logik (Queries/Mutationen).
*   **UI-Komponenten**: Basiskomponenten liegen in `src/components/ui/` (Shadcn-basiert).

### 2. State-Management & API
*   Nutze **TanStack Query** für alle Server-Daten.
*   API-Services befinden sich in `src/api/services/`.
*   Verwende **Zustand** für globalen Client-State nur, wenn absolut notwendig.

### 3. Internationalisierung (i18n)
*   Alle Texte müssen über `useTranslation()` (i18next) übersetzt werden.
*   Übersetzungsdateien befinden sich in `src/locales/[de|en]/*.json`.

### 4. Styling
*   Nutze ausschließlich **Tailwind CSS** utility classes.
*   Nutze `clsx` oder `tailwind-merge` für bedingte Klassen.
*   Halte das Design konsistent zum "Business-Look" (Dunkelgrün `#003333`, Brand-Primary `#1B4D4F`).

---

## Entwicklung

### Installation
```bash
npm install
```

### Dev-Server starten
```bash
npm run dev
```

### Build erstellen
```bash
npm run build
```

## Verzeichnisstruktur
- `src/api`: Axios-Konfiguration und API-Services.
- `src/components`: Wiederverwendbare Komponenten (ui, common, layout).
- `src/hooks`: Globale React Hooks.
- `src/pages`: Alle Anwendungsseiten.
- `src/context`: React Contexts (Auth, etc.).
- `src/types`: TypeScript Interfaces & Types.
