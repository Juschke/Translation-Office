# E-Mail-Konfiguration für Passwort-Reset

## Problem
E-Mails werden aktuell nur ins Log geschrieben (`MAIL_MAILER=log`), aber nicht wirklich versendet.

## Lösung 1: Temporär - Link aus dem Log holen

Wenn Sie "Passwort vergessen" verwendet haben, holen Sie den Link aus dem Log:

```bash
# Im Backend-Ordner:
php artisan password:show-reset-link
```

Dieser Befehl zeigt Ihnen den letzten generierten Reset-Link, den Sie direkt im Browser öffnen können.

## Lösung 2: Mailtrap für Development (Empfohlen)

Mailtrap ist ein Fake-SMTP-Server, der E-Mails abfängt, ohne sie wirklich zu versenden.

### Schritt 1: Mailtrap-Account erstellen
1. Gehen Sie zu [mailtrap.io](https://mailtrap.io)
2. Registrieren Sie sich kostenlos
3. Erstellen Sie ein neues Inbox

### Schritt 2: SMTP-Credentials kopieren
In Ihrer Mailtrap-Inbox finden Sie die SMTP-Credentials:
- Host: `sandbox.smtp.mailtrap.io`
- Port: `2525`
- Username: `[Ihr Username]`
- Password: `[Ihr Password]`

### Schritt 3: .env-Datei aktualisieren
Öffnen Sie `/backend/.env` und ändern Sie folgende Zeilen:

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=ihr_mailtrap_username
MAIL_PASSWORD=ihr_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@translatoroffice.de"
MAIL_FROM_NAME="Translator Office"
```

### Schritt 4: Queue-Worker starten
Passwort-Reset-E-Mails werden über die Queue versendet:

```bash
# Im Backend-Ordner:
php artisan queue:work
```

**Oder mit composer dev (empfohlen):**
```bash
composer dev
# Das startet automatisch: Server + Queue + Logs + Vite
```

### Schritt 5: Testen
1. Gehen Sie zu `/forgot-password` im Frontend
2. Geben Sie eine E-Mail-Adresse ein
3. Prüfen Sie Ihre Mailtrap-Inbox - die E-Mail sollte dort ankommen

## Lösung 3: Mailpit (Lokal ohne Account)

Mailpit ist eine lokale Alternative zu Mailtrap, die keine Registrierung benötigt.

### Installation mit Docker:
```bash
docker run -d --name=mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

### .env-Konfiguration:
```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@translatoroffice.de"
MAIL_FROM_NAME="Translator Office"
```

Web-Interface: http://localhost:8025

## Lösung 4: Echtes SMTP (Gmail, etc.)

Für Production oder wenn Sie echte E-Mails senden möchten:

### Gmail-Beispiel:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ihre.email@gmail.com
MAIL_PASSWORD=ihr_app_passwort
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@translatoroffice.de"
MAIL_FROM_NAME="Translator Office"
```

**Wichtig**: Bei Gmail müssen Sie ein "App-Passwort" erstellen, nicht Ihr normales Passwort verwenden.

## Troubleshooting

### E-Mails kommen nicht an?
1. Prüfen Sie, ob der Queue-Worker läuft: `php artisan queue:work`
2. Prüfen Sie die `failed_jobs`-Tabelle: `SELECT * FROM failed_jobs`
3. Prüfen Sie das Laravel-Log: `tail -f storage/logs/laravel.log`

### Queue-Jobs prüfen:
```bash
# Alle Jobs anzeigen
php artisan queue:listen --verbose

# Failed Jobs neu versuchen
php artisan queue:retry all
```

### Cache leeren nach .env-Änderungen:
```bash
php artisan config:clear
php artisan cache:clear
```
