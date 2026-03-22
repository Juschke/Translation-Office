# Translation Office - Marketing Landing Page

SEO-optimierte Marketing-Website für das Translation Office TMS im DACH-Raum.

## 🎯 Übersicht

Diese Landing Page ist ein moderner, responsiver Onepager, der speziell für die Vermarktung der Translation Office Software in Deutschland, Österreich und der Schweiz entwickelt wurde.

## ✨ Features

### SEO-Optimierung
- ✅ Meta-Tags für Suchmaschinen
- ✅ Open Graph für Social Media
- ✅ Strukturierte Daten (Schema.org)
- ✅ Semantisches HTML5
- ✅ Optimierte Ladezeiten
- ✅ Mobile-First Design

### Inhalte
- **Hero Section** - Großer Einstiegsbereich mit CTA
- **Features** - 6 Hauptfunktionen des TMS
- **Vorteile** - Kaufargumente und USPs
- **Social Proof** - Statistiken und Zahlen
- **Testimonials** - Kundenbewertungen
- **Preise** - 3 Preispakete (Starter, Professional, Enterprise)
- **Demo-Formular** - Lead-Generierung
- **Footer** - Navigation und rechtliche Hinweise

### Design
- Modern und professionell
- Tailwind CSS Framework
- Responsive (Mobile, Tablet, Desktop)
- Animationen und Hover-Effekte
- Markenfarbe: Teal (#1B4D4F)
- Deutsche Texte

## 📁 Struktur

```
landing-page/
├── index.html          # Haupt-HTML-Datei
├── css/
│   └── styles.css      # Custom CSS (Animationen, Utilities)
├── js/
│   └── main.js         # JavaScript (Navigation, Formulare, Analytics)
├── images/             # Bilder-Ordner (Screenshots, Logos)
│   ├── dashboard-mockup.png
│   ├── benefits-illustration.png
│   └── og-image.jpg
├── assets/             # Assets (Favicons, Icons)
│   └── favicon.svg
└── README.md           # Diese Datei
```

## 🚀 Installation & Verwendung

### Lokale Entwicklung

1. **Dateien öffnen**
   ```bash
   cd landing-page
   ```

2. **Mit Live-Server öffnen** (empfohlen)
   - VS Code Extension: "Live Server"
   - Oder Python SimpleHTTPServer:
     ```bash
     python -m http.server 8080
     ```

3. **Im Browser öffnen**
   ```
   http://localhost:8080/index.html
   ```

### Produktions-Deployment

1. **Bilder hinzufügen**
   - Screenshot des Dashboards → `/images/dashboard-mockup.png`
   - Illustration für Vorteile → `/images/benefits-illustration.png`
   - Social Media Bild → `/images/og-image.jpg` (1200x630px)
   - Favicon → `/assets/favicon.svg`

2. **Tailwind CSS produktionsreif machen**
   ```bash
   # Tailwind CLI installieren
   npm install -D tailwindcss

   # Build für Produktion
   npx tailwindcss -o css/tailwind.min.css --minify
   ```

3. **Analytics einbinden**
   - Google Analytics 4 Code in `index.html` einfügen
   - Meta Pixel Code hinzufügen
   - Conversion Tracking konfigurieren

4. **Backend-Integration**
   - Demo-Formular mit Backend-API verbinden
   - E-Mail-Service einrichten (SendGrid, Mailgun, etc.)
   - CRM-Integration (HubSpot, Salesforce, etc.)

## 🎨 Anpassungen

### Farben ändern
In `index.html` im `<script>` Tag:
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#1B4D4F',        // Hauptfarbe
                'primary-dark': '#143A3C',  // Dunklere Variante
                'primary-light': '#2A6A6D', // Hellere Variante
            }
        }
    }
}
```

### Texte ändern
Alle Texte sind direkt in `index.html` zu finden und können angepasst werden.

### Bilder austauschen
Ersetzen Sie die Platzhalter-URLs durch echte Bilder:
```html
<img src="/landing-page/images/dashboard-mockup.png" alt="Dashboard">
```

## 📊 SEO-Checkliste

- [x] Meta Title (50-60 Zeichen)
- [x] Meta Description (150-160 Zeichen)
- [x] Keywords
- [x] Open Graph Tags
- [x] Structured Data (Schema.org)
- [x] Alt-Tags für Bilder
- [x] Semantische HTML-Struktur
- [x] Mobile-Optimierung
- [x] Ladezeit-Optimierung
- [ ] Sitemap.xml erstellen
- [ ] Robots.txt erstellen
- [ ] Google Search Console einrichten
- [ ] SSL-Zertifikat (HTTPS)

## 🔒 DSGVO / Datenschutz

- Cookie-Banner integriert
- Datenschutzerklärung verlinkt
- Impressum verlinkt
- Opt-In für Analytics

## 📈 Conversion-Optimierung

- **CTA-Buttons**: Prominent platziert, klare Handlungsaufforderung
- **Social Proof**: Statistiken, Testimonials, Trust-Badges
- **Formular**: Kurz und einfach (nur 4 Felder)
- **Preistransparenz**: Alle Preise klar dargestellt
- **Mobile-First**: 60%+ der Besucher sind mobil

## 🛠️ Technologie-Stack

- **HTML5** - Semantisches Markup
- **Tailwind CSS** - Utility-First CSS Framework
- **Vanilla JavaScript** - Keine Dependencies
- **Google Fonts** - Inter Font-Familie
- **Responsive Design** - Mobile, Tablet, Desktop

## 📞 Support & Kontakt

Für Fragen oder Anpassungswünsche:
- E-Mail: support@translation-office.de
- Telefon: +49 30 123 456 789

## 📝 License

© 2026 Translation Office. Alle Rechte vorbehalten.

---

**Version**: 1.0.0
**Letztes Update**: März 2026
**Autor**: Translation Office Team
