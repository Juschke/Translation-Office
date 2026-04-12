# B2B Features Guide – Phase 3

Dieses Dokument beschreibt die in Phase 3 implementierten B2B-Kernfunktionen für das Translation Office TMS System.

---

## 1. Payment Gateway Integration (Stripe)

### Übersicht
Stripe-Integration für sichere Zahlungsverarbeitung mit vollständiger API-Unterstützung.

### Features
- **Payment Intents**: Erstelle Payment Intents für Rechnungen
- **Payment Processing**: Verarbeite erfolgreiche Zahlungen
- **Refunds**: Teilweise oder vollständige Rückerstattungen
- **Webhook Handling**: Automatische Verarbeitung von Stripe-Events
- **Stripe Customer Management**: Automatische Kundenerstellung in Stripe

### Implementation

#### Modelle
- `Payment::class` - Zahlungsdatensätze mit Status und Stripe-IDs

#### Services
- `PaymentService` - Zentrale Service-Klasse für Payment-Operationen

#### Controller
- `PaymentController` - API-Endpoints für Payment-Management

#### Events
- `PaymentSucceeded` - Broadcast-Event bei erfolgreicher Zahlung
- `PaymentFailed` - Broadcast-Event bei fehlgeschlagener Zahlung

### API Endpoints

```
POST   /api/payments/create-intent
POST   /api/payments/confirm
GET    /api/payments/invoice/{invoice}
POST   /api/payments/{payment}/refund
```

### Beispiel: Zahlungsfluss

```php
// 1. Payment Intent erstellen
$intent = $paymentService->createPaymentIntent($invoice, $customerId);
// Rückgabe: { "client_secret": "...", "amount": 150.00 }

// 2. Frontend: Stripe Elements mit client_secret
// 3. Nach Stripe-Verarbeitung: confirm-Endpoint aufrufen
$payment = $paymentService->processPayment($intentId, $invoice);

// 4. Webhook: Stripe sendet payment_intent.succeeded
// 5. System: Rechnung wird auf "paid" gesetzt
```

### Database Schema

```
payments
├── id (PK)
├── invoice_id (FK)
├── tenant_id (FK)
├── amount (decimal)
├── currency (char 3)
├── payment_method (stripe, bank_transfer, cash)
├── stripe_intent_id
├── stripe_charge_id
├── status (pending, completed, failed, refunded)
├── paid_at (datetime)
├── refunded_amount (decimal)
├── refunded_at (datetime)
├── metadata (JSON)
└── timestamps

invoices
├── stripe_intent_id (nullable)
├── currency (char 3, default: EUR)
└── paid_at (nullable datetime)

customers
└── stripe_customer_id (nullable string)
```

---

## 2. Webhooks & Event System

### Übersicht
Flexibles Webhook-System für externe Integrati onen und Event-Handling.

### Features
- **Custom Webhooks**: Definiere welche Events an externe URLs gesendet werden
- **Event Filtering**: Wähle spezifische Events aus
- **Custom Headers**: Sende zusätzliche HTTP-Header
- **Retry Logic**: Automatische Wiederholungen mit Exponential Backoff
- **Webhook Deactivation**: Auto-Deaktivierung bei zu vielen Fehlern
- **Stripe Integration**: Native Stripe Webhook-Unterstützung

### Implementation

#### Modelle
- `Webhook::class` - Webhook-Definitionen mit Events und URL

#### Jobs
- `TriggerWebhook::class` - Async Job für Webhook-Delivery

#### Controller
- `WebhookController` - API-Endpoints und Webhook-Handler

### Verfügbare Events

```
invoice.created         - Neue Rechnung erstellt
invoice.issued          - Rechnung ausgestellt
payment.completed       - Zahlung erfolgreich
payment.failed          - Zahlung fehlgeschlagen
project.updated         - Projekt aktualisiert
project.completed       - Projekt abgeschlossen
customer.created        - Neuer Kunde
customer.updated        - Kunde aktualisiert
```

### API Endpoints

```
POST   /api/webhooks               - Webhook erstellen
GET    /api/webhooks               - Alle Webhooks auflisten
GET    /api/webhooks/{id}          - Webhook anzeigen
PUT    /api/webhooks/{id}          - Webhook aktualisieren
DELETE /api/webhooks/{id}          - Webhook löschen

POST   /api/webhooks/stripe        - Stripe Webhook (öffentlich)
POST   /api/webhooks/custom        - Custom Webhook (öffentlich)
```

### Beispiel: Webhook definieren

```php
Webhook::generate([
    'tenant_id' => auth()->user()->tenant_id,
    'name' => 'Payment Notifications',
    'url' => 'https://api.example.com/notifications/payments',
    'events' => ['payment.completed', 'payment.failed'],
    'headers' => [
        'Authorization' => 'Bearer secret-token',
        'X-Custom-Header' => 'value',
    ],
    'is_active' => true,
]);
```

### Webhook Payload

```json
{
  "event": "payment.completed",
  "timestamp": "2024-04-12T10:30:00Z",
  "webhook_id": 123,
  "data": {
    "payment_id": 456,
    "invoice_id": 789,
    "amount": 150.00,
    "currency": "EUR"
  }
}
```

### Database Schema

```
webhooks
├── id (PK)
├── tenant_id (FK)
├── name
├── url
├── token (encrypted)
├── events (JSON array)
├── headers (JSON)
├── is_active (boolean)
├── last_triggered_at (datetime)
├── metadata (JSON)
└── timestamps
```

---

## 3. API Key Management

### Übersicht
Sichere API-Key-Verwaltung mit Scopes, Rate-Limiting und IP-Whitelist.

### Features
- **Key Generation**: Sichere Schlüsselerstellung mit randomization
- **Scopes**: Granulare Permissions (invoices:read, projects:write, etc.)
- **Rate Limiting**: Pro-Key Request-Limits
- **IP Whitelist**: Beschränkung auf spezifische IPs
- **Expiration**: Optionaler Ablauf
- **Usage Tracking**: last_used_at für Audit-Trail

### Implementation

#### Modelle
- `ApiKey::class` - API-Keys mit verschlüsseltem Secret

#### Controller
- `ApiKeyController` - Management-Endpoints

### Available Scopes

```
invoices:read         - Rechnungen lesen
invoices:write        - Rechnungen erstellen/bearbeiten
projects:read         - Projekte lesen
projects:write        - Projekte erstellen/bearbeiten
customers:read        - Kunden lesen
customers:write       - Kunden erstellen/bearbeiten
payments:read         - Zahlungen anschauen
reports:read          - Reports abrufen
```

### API Endpoints

```
POST   /api/api-keys                      - Key erstellen
GET    /api/api-keys                      - Alle Keys auflisten
GET    /api/api-keys/{id}                 - Key anzeigen
PUT    /api/api-keys/{id}                 - Key aktualisieren
DELETE /api/api-keys/{id}                 - Key löschen
POST   /api/api-keys/{id}/regenerate-secret - Secret neu generieren
```

### Beispiel: API Key generieren

```php
$key = ApiKey::generate([
    'tenant_id' => auth()->user()->tenant_id,
    'name' => 'External Integration',
    'scopes' => ['invoices:read', 'projects:read'],
    'rate_limit' => 1000, // pro Minute
    'ip_whitelist' => ['192.168.1.1', '10.0.0.0/8'],
    'expires_at' => now()->addYear(),
]);

// Rückgabe:
// {
//   "id": 123,
//   "key": "sk_abcd1234...",
//   "message": "API Key erstellt. Bitte kopiere den Key jetzt – er wird nicht erneut angezeigt!"
// }
```

### API Authentifizierung mit Key

```bash
curl -H "Authorization: Bearer sk_abcd1234..." \
     -H "X-API-Secret: <secret-hash>" \
     https://api.example.com/api/invoices
```

### Database Schema

```
api_keys
├── id (PK)
├── tenant_id (FK)
├── name
├── key (unique)
├── secret (encrypted)
├── scopes (JSON array)
├── rate_limit (integer)
├── ip_whitelist (JSON array)
├── last_used_at (datetime)
├── expires_at (datetime)
├── is_active (boolean)
├── metadata (JSON)
└── timestamps
```

---

## 4. Multi-Currency Support

### Übersicht
Vollständige Unterstützung für mehrere Währungen in Rechnungen und Zahlungen.

### Features
- **Currency per Invoice**: Jede Rechnung kann eigene Währung haben
- **Payment Currency Matching**: Zahlungswährung muss mit Rechnung übereinstimmen
- **Stripe Integration**: Automatische Anpassung für Stripe
- **Reporting**: Currency-aware Reporting

### Implementation

#### Änderungen
- `invoices.currency` - Währung (3-stelliger Code, z.B. EUR, USD, GBP)
- `payments.currency` - Währung der Zahlung
- `Payment Service` - Unterstützt multi-currency

### Beispiel

```php
$invoice = Invoice::create([
    'currency' => 'USD', // oder EUR, GBP, CHF, etc.
    'amount_gross' => 15000, // Cents: 150.00 USD
]);

// Stripe Payment Intent wird mit korrektem currency erstellt
$intent = $paymentService->createPaymentIntent($invoice);
// ➜ { "currency": "usd", "amount": 15000 }
```

---

## 5. Zusammenfassung Phase 3 Umsetzung

### Implementierte Komponenten

| Feature | Status | Files |
|---------|--------|-------|
| Payment Gateway | ✅ | PaymentService, PaymentController, Payment Model |
| Stripe Integration | ✅ | WebhookController, PaymentService |
| Webhooks | ✅ | Webhook Model, TriggerWebhook Job |
| API Keys | ✅ | ApiKey Model, ApiKeyController |
| Multi-Currency | ✅ | Invoice & Payment Models |
| Events Broadcasting | ✅ | PaymentSucceeded, PaymentFailed Events |

### Migrationen
- `2024_04_12_create_payments_table` - Payment-Tabelle
- `2024_04_12_create_api_keys_table` - API-Keys-Tabelle
- `2024_04_12_create_webhooks_table` - Webhooks-Tabelle
- `2024_04_12_add_payment_fields_to_tables` - Stripe & Currency-Felder

---

## 6. Konfiguration

### Stripe Setup

```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Filament Integration (Admin Panel)

```php
// backend/app/Filament/Resources/PaymentResource.php
// backend/app/Filament/Resources/ApiKeyResource.php
// backend/app/Filament/Resources/WebhookResource.php
```

---

## 7. Security Considerations

### Payment Security
- ✅ All Stripe communication over HTTPS
- ✅ Webhook signature verification (production only)
- ✅ Idempotent payment processing
- ✅ PCI DSS Compliance via Stripe (no card data stored)

### API Key Security
- ✅ Secrets encrypted at rest
- ✅ IP Whitelist enforcement
- ✅ Rate limiting per key
- ✅ Expiration enforcement
- ✅ Audit trail via activity logs

### Webhook Security
- ✅ Token-based authentication
- ✅ Custom header support for HMAC
- ✅ Retry logic with exponential backoff
- ✅ Auto-deactivation on repeated failures

---

## 8. Testing

### Payment Tests
```bash
php artisan test --filter PaymentControllerTest
php artisan test --filter PaymentServiceTest
```

### Webhook Tests
```bash
php artisan test --filter WebhookControllerTest
php artisan test --filter TriggerWebhookJobTest
```

### API Key Tests
```bash
php artisan test --filter ApiKeyControllerTest
```

---

## 9. Next Steps (Phase 4+)

Weitere geplante B2B-Features:

1. **Dunning Management** - Automatisierte Zahlungserinnerungen
2. **Approval Workflows** - Multi-Level Genehmigungen
3. **SLA Management** - Service Level Agreements
4. **Advanced Reporting** - Custom Reports Generator
5. **Customer Portal** - Self-Service für Kunden
6. **Service Integration** - CAT Tools, Translation APIs
7. **Bulk Operations** - Batch Processing
8. **Data Import/Export** - CSV, Excel, XML Support
