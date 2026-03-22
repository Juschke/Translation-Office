# Deployment-Anleitung - Translation Office Landing Page

## 🚀 Deployment-Optionen

### Option 1: Traditionelles Web-Hosting (cPanel, Plesk)

#### Voraussetzungen
- Webhosting mit Apache/Nginx
- FTP/SFTP-Zugang
- Domain registriert (z.B. translation-office.de)

#### Schritte
1. **Bilder vorbereiten**
   - Alle erforderlichen Bilder erstellen (siehe `assets/BILDER-ANFORDERUNGEN.md`)
   - Bilder optimieren (TinyPNG.com)
   - In `/images/` und `/assets/` hochladen

2. **Domain konfigurieren**
   - DNS A-Record auf Server-IP zeigen lassen
   - SSL-Zertifikat installieren (Let's Encrypt empfohlen)
   - In `.htaccess` HTTPS-Weiterleitung aktivieren

3. **Dateien hochladen**
   ```bash
   # Via FTP/SFTP alle Dateien in das Web-Root-Verzeichnis hochladen
   # Normalerweise: /public_html/ oder /www/
   ```

4. **Testen**
   - https://translation-office.de/landing-page/ aufrufen
   - Mobile Ansicht testen
   - Formular testen
   - Performance mit Google PageSpeed Insights testen

---

### Option 2: GitHub Pages (Kostenlos)

#### Voraussetzungen
- GitHub Account
- Git installiert

#### Schritte
1. **Repository erstellen**
   ```bash
   cd landing-page
   git init
   git add .
   git commit -m "Initial commit: Translation Office Landing Page"
   ```

2. **Zu GitHub pushen**
   ```bash
   git remote add origin https://github.com/IhrUsername/translation-office-landing.git
   git branch -M main
   git push -u origin main
   ```

3. **GitHub Pages aktivieren**
   - GitHub Repository → Settings → Pages
   - Source: Deploy from a branch
   - Branch: main → /root
   - Save

4. **Custom Domain (optional)**
   - Custom domain: `translation-office.de`
   - DNS CNAME Record erstellen: `www` → `IhrUsername.github.io`

**URL**: https://IhrUsername.github.io/translation-office-landing/

---

### Option 3: Netlify (Empfohlen - Kostenlos)

#### Voraussetzungen
- Netlify Account (kostenlos)
- GitHub Repository (oder lokale Dateien)

#### Schritte
1. **Netlify verbinden**
   - https://netlify.com → Sign Up
   - "Add new site" → "Import an existing project"
   - GitHub Repository auswählen

2. **Build-Settings**
   ```
   Build command: (leer lassen - statische Seite)
   Publish directory: /
   ```

3. **Deploy**
   - "Deploy site" klicken
   - Netlify generiert automatisch URL: `random-name-12345.netlify.app`

4. **Custom Domain**
   - Domain settings → Add custom domain
   - `translation-office.de` eingeben
   - DNS-Einträge wie angezeigt konfigurieren
   - Netlify generiert automatisch kostenloses SSL-Zertifikat

**Vorteile**:
- ✅ Automatische HTTPS
- ✅ CDN weltweit
- ✅ Automatische Deploys bei Git-Push
- ✅ Formulare (bis 100/Monat kostenlos)
- ✅ Analytics

---

### Option 4: Vercel (Alternativ zu Netlify)

Ähnlich wie Netlify, ebenfalls kostenlos für statische Seiten.

#### Schritte
1. https://vercel.com → Sign Up
2. "Import Project" → GitHub Repository
3. Deploy
4. Custom Domain hinzufügen

---

### Option 5: XAMPP Lokal (Entwicklung)

Für lokales Testen mit XAMPP:

```bash
# Dateien sind bereits im richtigen Ordner
cd C:\xampp\htdocs\Translation-Office\landing-page

# XAMPP Apache starten
# Browser öffnen: http://localhost/Translation-Office/landing-page/
```

---

## 🔧 Nach dem Deployment

### 1. SEO-Tools einrichten

#### Google Search Console
```
1. https://search.google.com/search-console
2. Property hinzufügen: translation-office.de
3. Inhaberschaft bestätigen (HTML-Tag oder DNS)
4. Sitemap einreichen: https://translation-office.de/landing-page/sitemap.xml
```

#### Google Analytics 4
```html
<!-- In index.html vor </head> einfügen -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Meta Pixel (Facebook)
```html
<!-- In index.html vor </head> einfügen -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

### 2. Performance-Optimierung

#### Bilder komprimieren
```bash
# Online: tinypng.com
# Oder mit CLI:
npm install -g imagemin-cli
imagemin images/*.png --out-dir=images/ --plugin=pngquant
```

#### CSS/JS minifizieren (Produktion)
```bash
# Tailwind CSS Production Build
npx tailwindcss -o css/tailwind.min.css --minify

# JavaScript minifizieren
npx terser js/main.js -o js/main.min.js
```

### 3. E-Mail-Integration

#### Option A: EmailJS (Kostenlos)
```javascript
// In js/main.js das Formular anpassen:
emailjs.send("service_id", "template_id", {
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone
});
```

#### Option B: Backend-API
```javascript
// Formular an eigene API senden
fetch('https://api.translation-office.de/demo-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

#### Option C: Netlify Forms
```html
<!-- Im <form> Tag hinzufügen -->
<form name="demo" method="POST" data-netlify="true">
```

### 4. Monitoring einrichten

- **Uptime Monitoring**: UptimeRobot.com (kostenlos)
- **Performance**: Google PageSpeed Insights
- **SEO**: Ahrefs, SEMrush, oder Ubersuggest

---

## ✅ Deployment-Checkliste

Vor dem Go-Live:

- [ ] Alle Bilder hochgeladen und optimiert
- [ ] Domain mit SSL konfiguriert
- [ ] Alle Links funktionieren
- [ ] Formular sendet E-Mails
- [ ] Mobile Ansicht getestet
- [ ] Google Analytics aktiviert
- [ ] Google Search Console eingerichtet
- [ ] Sitemap eingereicht
- [ ] robots.txt korrekt
- [ ] 404-Seite funktioniert
- [ ] DSGVO-Konformität geprüft
- [ ] Cookie-Banner funktioniert
- [ ] Performance > 90 (PageSpeed)
- [ ] Cross-Browser getestet (Chrome, Firefox, Safari, Edge)
- [ ] Rechtliche Seiten verlinkt (Impressum, Datenschutz, AGB)

---

## 🆘 Troubleshooting

### Problem: HTTPS funktioniert nicht
```bash
# Prüfen Sie SSL-Zertifikat
openssl s_client -connect translation-office.de:443

# Let's Encrypt Zertifikat erneuern
sudo certbot renew
```

### Problem: Bilder werden nicht angezeigt
- Dateipfade prüfen (case-sensitive auf Linux!)
- Berechtigungen prüfen (chmod 644 für Dateien)
- Browser-Cache leeren

### Problem: Formular sendet nicht
- Browser-Konsole auf Fehler prüfen (F12)
- CORS-Einstellungen prüfen
- Backend-API erreichbar?

---

## 📞 Support

Bei Fragen zum Deployment:
- **Dokumentation**: Siehe README.md
- **Issues**: GitHub Issues erstellen
- **E-Mail**: support@translation-office.de

---

**Version**: 1.0.0
**Stand**: März 2026
