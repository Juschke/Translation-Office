# Auth Hero Image

## So ersetzen Sie das Placeholder-Bild:

1. **Platzieren Sie Ihr Bild** in diesem Ordner (`/frontend/public/`)
   - Empfohlene Dateigröße: ca. 1200x1600px (Hochformat)
   - Format: JPG oder PNG
   - Beispiel-Name: `auth-hero.jpg`

2. **Aktualisieren Sie den Pfad** in der Datei:
   - **Datei**: `/frontend/src/components/auth/AuthLayout.tsx`
   - **Zeile**: Suchen Sie nach `backgroundImage: 'url(/auth-hero-placeholder.jpg)'`
   - **Ersetzen Sie** `/auth-hero-placeholder.jpg` mit Ihrem Dateinamen, z.B. `/auth-hero.jpg`

## Beispiel:

```tsx
// Vorher:
<div className="absolute inset-0 bg-cover bg-center opacity-20"
     style={{ backgroundImage: 'url(/auth-hero-placeholder.jpg)' }}>
</div>

// Nachher:
<div className="absolute inset-0 bg-cover bg-center opacity-20"
     style={{ backgroundImage: 'url(/auth-hero.jpg)' }}>
</div>
```

## Tipps für das perfekte Bild:

- Verwenden Sie ein professionelles Foto (z.B. moderne Büroumgebung, Team bei der Arbeit)
- Vermeiden Sie zu viele Details, da das Bild mit 20% Opacity angezeigt wird
- Helle/mittlere Töne funktionieren gut mit dem Teal-Gradient
- Orientierung: Hochformat (Portrait) funktioniert am besten für dieses Layout
