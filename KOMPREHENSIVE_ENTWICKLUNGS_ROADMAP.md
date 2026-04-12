# 📊 KOMPREHENSIVE ENTWICKLUNGS-ROADMAP & FEATURE-LISTE
## Translation Office TMS — Vollständige Analyse & Umsetzungsleitfaden

**Datum:** 2026-04-12  
**Version:** 2.0 (Erweitert)  
**Zielgruppe:** Engineering Lead, Product Manager, Security Officer  
**Umfang:** 100+ fehlende Features, 50+ Sicherheitsverbesserungen, 30+ Performance-Optimierungen

---

## INHALTSVERZEICHNIS

1. [Executive Summary](#executive-summary)
2. [Sicherheits-Roadmap (50+ Items)](#security-roadmap)
3. [Feature-Katalog (100+ Items)](#feature-katalog)
4. [Performance-Optimierungen (30+ Items)](#performance-optimierungen)
5. [Infrastruktur & DevOps (25+ Items)](#infrastruktur--devops)
6. [Testing & QA (20+ Items)](#testing--qa)
7. [Dokumentation & Support (15+ Items)](#dokumentation--support)
8. [Priorisierungs-Matrix](#priorisierungs-matrix)
9. [Detaillierte Implementierungs-Guides](#detaillierte-implementierungs-guides)

---

## EXECUTIVE SUMMARY

**Status quo:**
- ✅ Solide Multi-Tenancy-Architektur
- ✅ Grundlegende Invoice-Verwaltung
- ❌ 9 kritische Sicherheitslücken
- ❌ 100+ Enterprise-Features fehlend
- ❌ 30+ Performance-Probleme
- ❌ 0% Automation für B2B

**Ziel:**
Skalierbare, sichere, vollautomatisierte **B2B SaaS-Plattform** für Translation Management

**Aufwand:**
- Phase 1 (Security): 4 Wochen
- Phase 2 (Performance): 3 Wochen
- Phase 3 (B2B Core): 8 Wochen
- Phase 4 (Enterprise): 12 Wochen
- **Gesamt: 27 Wochen = ~6 Monate**

**Team-Komposition:**
- 2-3 Backend-Devs (Laravel/PHP)
- 1-2 Frontend-Devs (React/TypeScript)
- 1 DevOps/Infrastructure
- 1 QA/Testing Engineer
- 1 Security Officer (Part-time)

---

## SECURITY ROADMAP

### 🔴 KRITISCH (Sofort, diese Woche)

#### 1. **APP_DEBUG=false in Production**
**Risk Level:** 🔴 9.8 | **CVSS:** 9.8  
**Impact:** Stack-Traces expose entire application architecture

**Umsetzung:**
```php
// .env.production
APP_DEBUG=false

// .env.local (Development)
APP_DEBUG=true

// config/app.php
'debug' => env('APP_DEBUG', false),

// app/Exceptions/Handler.php
public function register()
{
    $this->reportable(function (Throwable $e) {
        if (config('app.debug')) {
            // Log with full context only in debug mode
            Log::debug($e);
        } else {
            // Production: log generic message only
            Log::error('An error occurred', [
                'exception_type' => get_class($e),
                'user_id' => auth()->id(),
            ]);
        }
    });
}
```

**Checkliste:**
- [ ] .env.production erstellen
- [ ] APP_DEBUG=false setzen
- [ ] Error-Handler testen
- [ ] Logs überprüfen (keine Stack-Traces)
- [ ] Deploy zu Production

**Aufwand:** 30 min

---

#### 2. **Implement HttpOnly Cookies für Token**
**Risk Level:** 🔴 9.5 | **CVSS:** 9.5  
**Impact:** XSS-Attacks können Tokens stehlen

**Schritt 1: Backend – Token in HttpOnly Cookie**
```php
// app/Http/Controllers/AuthController.php
class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();
        
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
        
        // Generate access + refresh tokens
        $accessToken = $user->createToken('access', ['*'], now()->addHour())->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;
        
        return response()->json([
            'user' => $user,
            'message' => 'Authenticated',
        ])
        ->cookie(
            name: 'access_token',
            value: $accessToken,
            minutes: 60,
            path: '/',
            domain: parse_url(config('app.url'), PHP_URL_HOST),
            secure: env('APP_ENV') === 'production',
            httpOnly: true,  // ✅ JS cannot access!
            sameSite: 'strict'  // ✅ CSRF protection
        )
        ->cookie(
            name: 'refresh_token',
            value: $refreshToken,
            minutes: 10080, // 7 days
            path: '/api/auth/refresh',
            domain: parse_url(config('app.url'), PHP_URL_HOST),
            secure: env('APP_ENV') === 'production',
            httpOnly: true,
            sameSite: 'strict'
        );
    }
    
    public function refresh(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Revoke old tokens
        $user->tokens()->delete();
        
        // Generate new tokens
        $accessToken = $user->createToken('access', ['*'], now()->addHour())->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;
        
        return response()->json(['message' => 'Token refreshed'])
            ->cookie('access_token', $accessToken, 60, secure: env('APP_ENV') === 'production', httpOnly: true, sameSite: 'strict')
            ->cookie('refresh_token', $refreshToken, 10080, secure: env('APP_ENV') === 'production', httpOnly: true, sameSite: 'strict');
    }
    
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        
        return response()->json(['message' => 'Logged out'])
            ->cookie('access_token', '', -1)
            ->cookie('refresh_token', '', -1);
    }
}
```

**Schritt 2: Middleware – Extrahiere Token aus Cookie**
```php
// app/Http/Middleware/ExtractTokenFromCookie.php
class ExtractTokenFromCookie
{
    public function handle($request, $next)
    {
        if (!$request->hasHeader('Authorization')) {
            $token = $request->cookie('access_token');
            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }
        
        return $next($request);
    }
}

// app/Http/Kernel.php
protected $middleware = [
    // ...
    \App\Http\Middleware\ExtractTokenFromCookie::class,
];
```

**Schritt 3: Frontend – Entferne localStorage**
```typescript
// frontend/src/api/axios.ts
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,  // ✅ Cookies automatically sent!
});

// Response Interceptor für 401 → Refresh
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Refresh token (automatic via cookie)
                await api.post('/auth/refresh');
                
                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed → redirect to login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
```

**Schritt 4: Frontend – Entferne localStorage-Zugriffe**
```typescript
// ❌ BEFORE
// frontend/src/context/AuthContext.tsx
const token = localStorage.getItem('token');

// ✅ AFTER
// Keine localStorage mehr nötig! Cookies senden automatisch
const api = axios.create({ withCredentials: true });
```

**Schritt 5: Konfiguriere Sanctum**
```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,localhost:5173,127.0.0.1')),
'expiration' => 60, // Access token: 60 minutes
'token_prefix' => 'auth_', // Für GitHub Secret Scanning erkennbar
```

**Checkliste:**
- [ ] Backend Token-Routes implementieren
- [ ] Middleware für Cookie-Extraction
- [ ] Frontend localStorage entfernen
- [ ] Axios Interceptors aktualisieren
- [ ] CSRF-Token Handling (optional: separate)
- [ ] Tests für Token-Refresh
- [ ] Cookie-SameSite testen (CSRF-Protection)
- [ ] HTTPS in Production erzwingen
- [ ] Deployment testen

**Aufwand:** 3-4 Tage

---

#### 3. **Reverb WebSocket – TLS + Origin Validation**
**Risk Level:** 🔴 9.1 | **CVSS:** 9.1  
**Impact:** Man-in-the-Middle, WebSocket-Hijacking

**Schritt 1: TLS-Zertifikat für Reverb**
```bash
# Option A: Let's Encrypt (Production)
certbot certonly --standalone -d your-domain.com

# Option B: Self-signed (Development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**Schritt 2: Konfiguriere Reverb mit TLS**
```php
// config/reverb.php
return [
    'apps' => [
        [
            'id' => env('REVERB_APP_ID'),
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'allowed_origins' => [
                'https://your-domain.com',
                'https://www.your-domain.com',
                'http://localhost:5173',  // Dev only
                'http://127.0.0.1:5173',
            ],
        ]
    ],
    'host' => env('REVERB_HOST', '0.0.0.0'),
    'port' => env('REVERB_PORT', 443),  // HTTPS port
    'scheme' => 'https',
    'tls' => [
        'cert_path' => env('REVERB_CERT_PATH', '/etc/letsencrypt/live/your-domain.com/fullchain.pem'),
        'key_path' => env('REVERB_KEY_PATH', '/etc/letsencrypt/live/your-domain.com/privkey.pem'),
    ],
    'scaling' => [
        'enabled' => env('REVERB_SCALING_ENABLED', true),
        'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
    ],
];
```

**Schritt 3: Middleware – Origin Validation**
```php
// app/Http/Middleware/ValidateWebSocketOrigin.php
class ValidateWebSocketOrigin
{
    public function handle($request, $next)
    {
        $origin = $request->header('Origin') ?? $request->header('Referer');
        
        if (!$origin) {
            return abort(403, 'Missing origin header');
        }
        
        $allowedOrigins = config('reverb.apps.0.allowed_origins');
        $originBase = parse_url($origin, PHP_URL_SCHEME) . '://' . parse_url($origin, PHP_URL_HOST);
        
        if (!in_array($originBase, $allowedOrigins)) {
            Log::warning('WebSocket origin not allowed', [
                'origin' => $origin,
                'ip' => $request->ip(),
            ]);
            return abort(403, 'Origin not allowed');
        }
        
        return $next($request);
    }
}

// routes/channels.php (if needed)
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
```

**Schritt 4: Frontend – Nutze Secure WebSocket**
```typescript
// frontend/src/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT || 443,
    wssPort: import.meta.env.VITE_REVERB_PORT || 443,
    forceTLS: true,  // ✅ Immer HTTPS/WSS
    encrypted: true,
    enabledTransports: ['ws', 'wss'],
});

// frontend/.env.production
VITE_REVERB_HOST=your-domain.com
VITE_REVERB_PORT=443
```

**Checkliste:**
- [ ] TLS-Zertifikat besorgen/generieren
- [ ] Reverb config mit TLS aktualisieren
- [ ] Origin-Whitelist konfigurieren
- [ ] Middleware aktivieren
- [ ] Frontend auf WSS aktualisieren
- [ ] Test: WebSocket-Verbindung (Browser DevTools)
- [ ] Test: Falscher Origin → 403
- [ ] Load-Test: 100+ concurrent connections

**Aufwand:** 2-3 Tage

---

#### 4. **CORS spezifisch konfigurieren**
**Risk Level:** 🔴 8.6 | **CVSS:** 8.6

**Implementierung:**
```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS', ['http://localhost:5173', 'http://localhost:3000']),
    'allowed_headers' => [
        'Accept',
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
    ],
    'exposed_headers' => [
        'Content-Disposition',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],
    'max_age' => 3600,
    'supports_credentials' => true,
];

// .env.production
CORS_ALLOWED_ORIGINS="https://app.your-domain.com,https://admin.your-domain.com"
```

**Checkliste:**
- [ ] Production URLs in config
- [ ] Teste CORS mit curl
- [ ] Preflight-Requests ✅
- [ ] Cross-Origin-Credentials ✅

**Aufwand:** 2-3 Stunden

---

#### 5. **Sanctum Token Expiration + Refresh Pattern**
**Risk Level:** 🔴 8.3 | **CVSS:** 8.3

**Implementierung:**
```php
// config/sanctum.php
'expiration' => 60, // 60 minutes (access token)

// app/Models/User.php
public function createTokensWithRefresh()
{
    $this->tokens()->delete(); // Revoke old tokens
    
    $accessToken = $this->createToken('access', ['*'], now()->addHours(1));
    $refreshToken = $this->createToken('refresh', ['refresh'], now()->addDays(7));
    
    return [
        'access_token' => $accessToken->plainTextToken,
        'refresh_token' => $refreshToken->plainTextToken,
        'expires_in' => 3600,
        'token_type' => 'Bearer',
    ];
}

// database/migrations/*_add_expires_at_to_personal_access_tokens.php
Schema::table('personal_access_tokens', function (Blueprint $table) {
    $table->timestamp('expires_at')->nullable()->after('last_used_at');
});

// app/Models/PersonalAccessToken.php (Sanctum Token model)
public function isExpired(): bool
{
    return $this->expires_at && $this->expires_at < now();
}

// Middleware: Prüfe Expiration
class CheckTokenExpiration
{
    public function handle($request, $next)
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }
        
        $token = $user->currentAccessToken();
        
        if ($token && $token->isExpired()) {
            $user->tokens()->where('id', $token->id)->delete();
            return response()->json(['message' => 'Token expired'], 401);
        }
        
        return $next($request);
    }
}
```

**Checkliste:**
- [ ] Expiration in config
- [ ] Token-Migration
- [ ] Refresh-Endpoint
- [ ] Expiration-Check Middleware
- [ ] Auto-Cleanup (alte Tokens)
- [ ] Tests

**Aufwand:** 1-2 Tage

---

#### 6. **Password Reset Token Expiration**
**Risk Level:** 🔴 7.8 | **CVSS:** 7.8

**Migration:**
```php
// database/migrations/*_add_expires_at_to_password_reset_tokens.php
Schema::table('password_reset_tokens', function (Blueprint $table) {
    $table->timestamp('expires_at')->default(DB::raw('DATE_ADD(NOW(), INTERVAL 1 HOUR)'))->after('token');
    $table->index('expires_at');
});
```

**Implementierung:**
```php
// app/Http/Controllers/AuthController.php
public function resetPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:users',
        'token' => 'required|string',
        'password' => 'required|min:8|confirmed|password_check',
    ]);
    
    // Find valid token
    $reset = DB::table('password_reset_tokens')
        ->where('email', $request->email)
        ->where('token', hash('sha256', $request->token))
        ->where('expires_at', '>', now())  // ✅ Check expiration
        ->first();
    
    if (!$reset) {
        return response()->json([
            'message' => 'Invalid or expired password reset token'
        ], 422);
    }
    
    // Update password
    $user = User::where('email', $request->email)->first();
    $user->update(['password' => Hash::make($request->password)]);
    
    // Delete token after use
    DB::table('password_reset_tokens')
        ->where('email', $request->email)
        ->delete();
    
    return response()->json(['message' => 'Password reset successfully']);
}

// Cleanup command
// app/Console/Commands/CleanupExpiredPasswordResets.php
class CleanupExpiredPasswordResets extends Command
{
    public function handle()
    {
        DB::table('password_reset_tokens')
            ->where('expires_at', '<', now())
            ->delete();
        
        $this->info('Expired password reset tokens cleaned up');
    }
}

// Kernel.php
$schedule->command('cleanup:expired-password-resets')->hourly();
```

**Checkliste:**
- [ ] Migration
- [ ] Reset-Logic aktualisieren
- [ ] Cleanup-Command
- [ ] Cron job
- [ ] Tests

**Aufwand:** 1-2 Tage

---

#### 7. **Encrypt Sensible Data (Bank-Infos, Tax-IDs)**
**Risk Level:** 🔴 8.5 | **CVSS:** 8.5

**Implementierung:**
```php
// app/Models/Customer.php
use Illuminate\Database\Eloquent\Casts\Encrypted;

class Customer extends Model implements BelongsToTenant
{
    use BelongsToTenant;
    
    protected $casts = [
        'iban' => Encrypted::class,
        'bic' => Encrypted::class,
        'account_holder' => Encrypted::class,
        'bank_name' => Encrypted::class,
        'tax_id' => Encrypted::class,
        'vat_id' => Encrypted::class,
        'phone' => Encrypted::class,
    ];
}

// app/Models/Partner.php
class Partner extends Model implements BelongsToTenant
{
    protected $casts = [
        'iban' => Encrypted::class,
        'bic' => Encrypted::class,
        'tax_id' => Encrypted::class,
        'email' => Encrypted::class,
    ];
}

// ✅ Automatische Verschlüsselung bei Speicherung
// ✅ Automatische Entschlüsselung beim Abruf
$customer = Customer::find(1);
echo $customer->iban;  // Entschlüsselt: DE89370400440532013000

// Datenbank-Ansicht (encrypted):
// SELECT * FROM customers;
// iban: "eyJpdiI6Ikp4bEg4VWc3N3ZGUWQ4QXo3NGc9PSIsInZhbHVlIjoiLzlMbGRraWZnWTh3MUpkZzZEUT09IiwibWFjIjoiZGRlMzc2ZjY4MjMxN2ZlZTc3OTIzMzAzYjBjODQwYjQwMjZmODQ5NjMxYTM3YzcwOTgzODdkMWZjMzk3OTNkOSJ9"
```

**Migration (Retrofit für bestehende Daten):**
```php
// database/migrations/*_encrypt_customer_sensitive_data.php
class EncryptCustomerSensitiveData extends Migration
{
    public function up()
    {
        // ⚠️ WARNUNG: Backup DB before!
        \Artisan::call('migrate:fresh --seed'); // In TEST environment!
        
        // Oder: Neue Column mit encrypted data, dann Swap
        Schema::table('customers', function (Blueprint $table) {
            $table->string('iban_encrypted')->nullable();
            $table->string('bic_encrypted')->nullable();
        });
        
        DB::table('customers')->each(function ($customer) {
            // Encrypt old plaintext
            DB::table('customers')
                ->where('id', $customer->id)
                ->update([
                    'iban_encrypted' => $customer->iban, // Laravel casts automatically
                    'bic_encrypted' => $customer->bic,
                ]);
        });
        
        // Swap columns
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['iban', 'bic']);
            $table->renameColumn('iban_encrypted', 'iban');
            $table->renameColumn('bic_encrypted', 'bic');
        });
    }
}
```

**Checkliste:**
- [ ] Backup DB
- [ ] Migration für neue Customers
- [ ] Migration für bestehende Daten
- [ ] Test: Encryption/Decryption
- [ ] Test: DB-View (encrypted)
- [ ] Test: Performance (Decryption overhead)
- [ ] Deployment zu Production

**Aufwand:** 2-3 Tage

---

#### 8. **2FA Recovery-Codes – Hash Instead of JSON**
**Risk Level:** 🔴 7.5 | **CVSS:** 7.5

**Migration:**
```php
// database/migrations/*_update_2fa_recovery_codes.php
class Update2FARecoveryCodes extends Migration
{
    public function up()
    {
        // Alte column löschen (Plaintext)
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_recovery_codes']);
        });
        
        // Neue column (Hashed)
        Schema::table('users', function (Blueprint $table) {
            $table->longText('two_factor_recovery_codes_hash')->nullable();
        });
    }
}
```

**Implementierung:**
```php
// app/Models/User.php
public function generateRecoveryCodes(): array
{
    $codes = [];
    $plainCodes = [];
    
    for ($i = 0; $i < 8; $i++) {
        $code = Str::random(4) . '-' . Str::random(4); // e.g., "ABCD-1234"
        $plainCodes[] = $code;
        
        $codes[] = [
            'code' => $code,
            'hash' => Hash::make($code),
            'used_at' => null,
        ];
    }
    
    $this->update([
        'two_factor_recovery_codes_hash' => json_encode($codes),
    ]);
    
    // ✅ Return plaintext codes ONCE (user must save them)
    return $plainCodes;
}

public function validateRecoveryCode(string $code): bool
{
    $codes = json_decode($this->two_factor_recovery_codes_hash, true) ?? [];
    
    foreach ($codes as &$record) {
        // Check hash + not yet used
        if (Hash::check($code, $record['hash']) && !$record['used_at']) {
            // Mark as used
            $record['used_at'] = now()->toDateTimeString();
            $this->update(['two_factor_recovery_codes_hash' => json_encode($codes)]);
            
            // Regenerate if only 2 or fewer left
            if ($this->getRemainingRecoveryCodes() <= 2) {
                Log::warning('User should regenerate recovery codes', ['user_id' => $this->id]);
            }
            
            return true;
        }
    }
    
    return false;
}

public function getRemainingRecoveryCodes(): int
{
    $codes = json_decode($this->two_factor_recovery_codes_hash, true) ?? [];
    return count(array_filter($codes, fn($code) => !$code['used_at']));
}
```

**Checkliste:**
- [ ] Migration
- [ ] Recovery-Codes neu generieren
- [ ] Validation-Logik
- [ ] Tests
- [ ] Frontend (Display nur beim Setup)
- [ ] Countdown für Regeneration

**Aufwand:** 1-2 Tage

---

#### 9. **Rate Limiting für Bulk-Operationen**
**Risk Level:** 🔴 7.9 | **CVSS:** 7.9

**Middleware:**
```php
// app/Http/Middleware/RateLimitBulkOperations.php
class RateLimitBulkOperations
{
    public function handle($request, $next)
    {
        if (!$this->isBulkOperation($request)) {
            return $next($request);
        }
        
        $user = $request->user();
        $limiter = RateLimiter::for('bulk-ops:' . $user->id, function ($req) {
            return Limit::perMinute(10)->by($req->user()?->id);
        });
        
        if ($limiter->tooManyAttempts()) {
            return response()->json([
                'message' => 'Too many bulk operations. Try again in ' . $limiter->availableIn() . ' seconds'
            ], 429);
        }
        
        // Limit items per request
        $itemCount = count($request->input('ids', []));
        if ($itemCount > 100) {
            return response()->json([
                'message' => 'Maximum 100 items per request',
                'max_items' => 100,
                'provided' => $itemCount,
            ], 422);
        }
        
        // Log bulk operation
        Log::info('Bulk operation performed', [
            'user_id' => $user->id,
            'operation' => $request->path(),
            'item_count' => $itemCount,
        ]);
        
        return $next($request);
    }
    
    private function isBulkOperation($request): bool
    {
        $bulkPaths = [
            'api/projects/bulk-delete',
            'api/invoices/bulk-delete',
            'api/customers/bulk-import',
            'api/partners/bulk-export',
        ];
        
        return in_array($request->path(), $bulkPaths);
    }
}

// app/Http/Kernel.php
protected $routeMiddleware = [
    'bulk-rate-limit' => \App\Http\Middleware\RateLimitBulkOperations::class,
];

// routes/api.php
Route::middleware('bulk-rate-limit')->group(function () {
    Route::delete('/projects/bulk-delete', [ProjectController::class, 'bulkDelete']);
    Route::delete('/invoices/bulk-delete', [InvoiceController::class, 'bulkDelete']);
    Route::post('/customers/bulk-import', [CustomerController::class, 'bulkImport']);
});
```

**Checkliste:**
- [ ] Middleware implementieren
- [ ] Bulk-Routes registrieren
- [ ] Rate-Limits testen
- [ ] Alerts bei Abuse
- [ ] Logging

**Aufwand:** 1 Tag

---

### 🟠 HOCH-PRIORITÄT (Nächste 2 Wochen)

#### 10. **Input Sanitization für RichText**

```typescript
// frontend/src/utils/sanitizer.ts
import DOMPurify from 'dompurify';

export const SAFE_HTML_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'blockquote', 'code', 'pre', 'a', 'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
    ALLOW_DATA_ATTR: false,
};

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Verhindere javascript: URLs
    const allowedProtocols = ['http://', 'https://', 'mailto:'];
    if (node.href) {
        const isAllowed = allowedProtocols.some(proto => node.href.startsWith(proto));
        if (!isAllowed) {
            node.removeAttribute('href');
        }
    }
    
    // target="_blank" erfordert rel="noopener noreferrer"
    if (node.target === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

export const sanitizeHtml = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
};

// frontend/src/components/inbox/EmailCompose.tsx
import { sanitizeHtml } from '@/utils/sanitizer';

export const EmailCompose: React.FC = () => {
    return (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailContent) }} />
    );
};
```

**Checkliste:**
- [ ] DOMPurify installieren & aktualisieren
- [ ] Sanitizer-Konfiguration
- [ ] Alle dangerouslySetInnerHTML Stellen identifizieren
- [ ] Backend-Validierung mit Purifier Package
- [ ] Tests

**Aufwand:** 1-2 Tage

---

#### 11. **Async Logging – ApiRequestLog Job**

```php
// app/Jobs/LogApiRequest.php
class LogApiRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public int $timeout = 30;
    public int $tries = 3;
    
    public function __construct(
        public string $method,
        public string $path,
        public int $statusCode,
        public float $duration,
        public int $memory,
        public ?int $userId,
        public string $ip,
        public array $requestData = [],
    ) {}
    
    public function handle()
    {
        ApiRequestLog::create([
            'user_id' => $this->userId,
            'method' => $this->method,
            'path' => $this->path,
            'status_code' => $this->statusCode,
            'duration_ms' => (int) ($this->duration * 1000),
            'memory_mb' => round($this->memory / 1024 / 1024, 2),
            'ip_address' => $this->ip,
            'request_data' => json_encode($this->redactSensitiveData($this->requestData)),
        ]);
    }
    
    private function redactSensitiveData(array $data): array
    {
        $sensitive = ['password', 'token', 'api_key', 'credit_card'];
        
        foreach ($sensitive as $key) {
            if (isset($data[$key])) {
                $data[$key] = '[REDACTED]';
            }
        }
        
        return $data;
    }
}

// app/Http/Middleware/LogApiRequests.php
class LogApiRequests
{
    public function handle($request, $next)
    {
        $start = microtime(true);
        $response = $next($request);
        $duration = microtime(true) - $start;
        
        // ✅ Non-blocking async job
        LogApiRequest::dispatch(
            method: $request->method(),
            path: $request->path(),
            statusCode: $response->getStatusCode(),
            duration: $duration,
            memory: memory_get_usage(),
            userId: $request->user()?->id,
            ip: $request->ip(),
            requestData: $request->all(),
        );
        
        return $response;
    }
}
```

**Checkliste:**
- [ ] Job implementieren
- [ ] Middleware aktualisieren
- [ ] Queue configurieren (database/redis)
- [ ] Tests
- [ ] Monitoring (queue backlog)

**Aufwand:** 2-3 Tage

---

#### 12. **Redis Caching für häufige Queries**

```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),

// .env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null

// app/Http/Controllers/ReportController.php
class ReportController extends Controller
{
    public function revenue(Request $request)
    {
        $cacheKey = sprintf(
            'report:revenue:%s:%s',
            $request->user()->tenant_id,
            now()->format('Y-m-d')
        );
        
        return Cache::remember($cacheKey, 3600, function () use ($request) {
            return Invoice::where('tenant_id', $request->user()->tenant_id)
                ->whereDate('issued_at', now())
                ->sum('amount_gross');
        });
    }
}

// Cache Invalidation
// app/Models/Invoice.php
protected static function booted()
{
    static::created(function ($invoice) {
        static::invalidateReportCache($invoice->tenant_id);
    });
    
    static::updated(function ($invoice) {
        static::invalidateReportCache($invoice->tenant_id);
    });
    
    static::deleted(function ($invoice) {
        static::invalidateReportCache($invoice->tenant_id);
    });
}

protected static function invalidateReportCache(int $tenantId)
{
    Cache::forget("report:revenue:$tenantId:" . now()->format('Y-m-d'));
    Cache::forget("report:revenue:$tenantId:" . now()->subDay()->format('Y-m-d'));
}
```

**Checkliste:**
- [ ] Redis installieren/konfigurieren
- [ ] Cache-Keys Design
- [ ] Cache::remember Pattern
- [ ] Cache Invalidation on writes
- [ ] Monitoring (hit rate)
- [ ] TTL tuning

**Aufwand:** 2-3 Tage

---

### 🟡 MITTEL-PRIORITÄT (Monat 2)

#### 13. **Async PDF Generation**

```php
// app/Jobs/GenerateInvoicePdf.php
class GenerateInvoicePdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public int $timeout = 120; // 2 minutes
    public int $tries = 3;
    
    public function __construct(public Invoice $invoice) {}
    
    public function handle()
    {
        try {
            $html = view('invoices.pdf-template', [
                'invoice' => $this->invoice,
            ])->render();
            
            $pdf = Pdf::loadHTML($html)
                ->setOption('defaultFont', 'Arial')
                ->setOption('margin-top', 10);
            
            $filePath = "invoices/inv-{$this->invoice->id}-" . now()->format('Ymd') . '.pdf';
            
            Storage::disk('local')->put($filePath, $pdf->output());
            
            // Update invoice with PDF path
            $this->invoice->update([
                'pdf_path' => $filePath,
                'pdf_generated_at' => now(),
            ]);
            
            // Notify user
            event(new InvoicePdfGenerated($this->invoice));
            
        } catch (\Exception $e) {
            Log::error('PDF generation failed', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }
}

// app/Http/Controllers/InvoiceController.php
public function generatePdf(Invoice $invoice)
{
    $this->authorize('view', $invoice);
    
    if (!$invoice->pdf_path) {
        GenerateInvoicePdf::dispatch($invoice);
        
        return response()->json([
            'message' => 'PDF generation started',
            'status' => 'queued',
        ], 202);
    }
    
    if (!Storage::exists($invoice->pdf_path)) {
        return response()->json(['message' => 'PDF not found'], 404);
    }
    
    return Storage::download($invoice->pdf_path, "invoice-{$invoice->invoice_number}.pdf");
}

// WebSocket event notification
// app/Events/InvoicePdfGenerated.php
class InvoicePdfGenerated
{
    public function __construct(public Invoice $invoice) {}
    
    public function broadcastOn()
    {
        return new PrivateChannel("user.{$this->invoice->user->id}");
    }
}

// frontend/src/hooks/useInvoicePdf.ts
export const useInvoicePdf = (invoiceId: string) => {
    useEffect(() => {
        Echo.private(`user.${user.id}`).listen('InvoicePdfGenerated', (e) => {
            if (e.invoice.id === invoiceId) {
                queryClient.invalidateQueries(['invoice', invoiceId]);
                toast.success('PDF generated!');
            }
        });
    }, [invoiceId]);
};
```

**Checkliste:**
- [ ] Job implementieren
- [ ] Queue configurieren
- [ ] Event notifications
- [ ] Frontend WebSocket listener
- [ ] Fallback (polling)
- [ ] Storage configurieren (local/S3)
- [ ] PDF templates
- [ ] Load testing

**Aufwand:** 2-3 Tage

---

#### 14. **Async Mail Sync**

```php
// app/Jobs/SyncMailbox.php
class SyncMailbox implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public int $timeout = 300; // 5 minutes
    public int $tries = 3;
    public int $backoff = 60;
    
    public function __construct(public MailAccount $mailAccount) {}
    
    public function handle()
    {
        Log::info('Syncing mailbox', ['account_id' => $this->mailAccount->id]);
        
        try {
            $client = new ImapClientAdapter($this->mailAccount);
            $messages = $client->getUnreadMessages();
            
            foreach ($messages as $message) {
                Mail::firstOrCreate(
                    [
                        'mail_account_id' => $this->mailAccount->id,
                        'message_id' => $message['message_id'],
                    ],
                    [
                        'from' => $message['from'],
                        'to' => $message['to'],
                        'subject' => $message['subject'],
                        'body' => $message['body'],
                        'received_at' => $message['date'],
                        'is_read' => false,
                    ]
                );
            }
            
            $this->mailAccount->update([
                'last_synced_at' => now(),
                'is_syncing' => false,
            ]);
            
            Log::info('Mailbox synced', [
                'account_id' => $this->mailAccount->id,
                'message_count' => count($messages),
            ]);
            
        } catch (ImapException $e) {
            Log::error('Mail sync failed', [
                'account_id' => $this->mailAccount->id,
                'error' => $e->getMessage(),
            ]);
            
            $this->mailAccount->update(['is_syncing' => false]);
            throw $e;
        }
    }
}

// app/Console/Commands/SyncAllMailboxes.php
class SyncAllMailboxes extends Command
{
    public function handle()
    {
        MailAccount::where('is_active', true)
            ->where('is_syncing', false)
            ->each(function ($account) {
                SyncMailbox::dispatch($account)->onQueue('emails');
            });
    }
}

// Kernel.php
$schedule->command('app:sync-all-mailboxes')->everyMinute();
```

**Checkliste:**
- [ ] Job implementieren
- [ ] IMAP-Client wrapper
- [ ] Error handling
- [ ] Exponential backoff
- [ ] Cron job
- [ ] Monitoring (sync frequency)
- [ ] Tests mit Test-Mailbox

**Aufwand:** 2-3 Tage

---

---

## FEATURE-KATALOG

### 📌 AUTHENTICATION & AUTHORIZATION (15 Features)

#### A. Multi-Factor Authentication (MFA) – Erweitert
**Status:** Basis ✅ | **Needed:** Erweiterte Optionen  
**Aufwand:** 5 Tage

**Features:**
```
✅ TOTP (Google Authenticator, Authy)
- Biometric (Face ID, Touch ID)
- SMS/Email OTP
- Security Keys (WebAuthn / FIDO2)
- Backup Codes
- Device Trust (30-day whitelist)
- MFA Enforcement Policy (admins)
```

**Implementierung:**
```php
// database/migrations/*_add_mfa_options.php
Schema::table('users', function (Blueprint $table) {
    $table->json('mfa_methods')->nullable(); // ['totp', 'webauthn', 'email']
    $table->json('trusted_devices')->nullable(); // [{'id': '...', 'expires_at': '...'}]
    $table->timestamp('last_mfa_at')->nullable();
});

// app/Services/MfaService.php
class MfaService
{
    public function enableWebAuthn(User $user)
    {
        $challenge = random_bytes(32);
        Cache::put("webauthn:$user->id:challenge", $challenge, 300);
        
        return [
            'challenge' => base64_encode($challenge),
            'rp' => config('mfa.webauthn.rp'),
            'user' => ['id' => $user->id, 'name' => $user->email],
        ];
    }
    
    public function verifyWebAuthn(User $user, array $attestation): bool
    {
        // Verify attestation object (complex crypto)
        // Return bool
    }
}

// Routes
Route::post('/mfa/webauthn/register', [MfaController::class, 'registerWebAuthn']);
Route::post('/mfa/webauthn/verify', [MfaController::class, 'verifyWebAuthn']);
Route::post('/mfa/trust-device', [MfaController::class, 'trustDevice']);
```

---

#### B. OAuth2 / OpenID Connect Integration
**Status:** Nicht vorhanden | **Needed:** Für B2B SSO  
**Aufwand:** 7 Tage

```php
// app/Http/Controllers/OAuth2Controller.php
class OAuth2Controller extends Controller
{
    public function authorize(Request $request)
    {
        // OAuth2 Authorization Endpoint
        // Returns: redirect_uri?code=...&state=...
    }
    
    public function token(Request $request)
    {
        // OAuth2 Token Endpoint
        // Returns: access_token, refresh_token, expires_in
    }
    
    public function userinfo(Request $request)
    {
        // OpenID Connect UserInfo Endpoint
    }
}

// Packages: laravel-passport oder laravel-socialite für externe OAuth
```

---

#### C. SAML2 Integration (Enterprise SSO)
**Status:** Nicht vorhanden | **Needed:** Enterprise-Kunden  
**Aufwand:** 10 Tage

```php
// composer require aacotroneo/laravel-saml2

// config/saml2/settings.php
return [
    'sp' => [
        'entityId' => config('app.url') . '/saml/metadata',
        'assertionConsumerService' => [
            'url' => config('app.url') . '/saml/acs',
        ],
        'singleLogoutService' => [
            'url' => config('app.url') . '/saml/sls',
        ],
    ],
    'idp' => [
        'entityId' => env('SAML2_IDP_ENTITY_ID'),
        'singleSignOnService' => [
            'url' => env('SAML2_IDP_SSO_URL'),
        ],
        'singleLogoutService' => [
            'url' => env('SAML2_IDP_SLO_URL'),
        ],
        'x509cert' => env('SAML2_IDP_CERT'),
    ],
];
```

---

#### D. API Key Management System
**Status:** Nicht vorhanden | **Priority:** HOCH | **Aufwand:** 5 Tage

```php
// app/Models/ApiKey.php
class ApiKey extends Model implements BelongsToTenant
{
    use BelongsToTenant;
    
    protected $fillable = ['name', 'key', 'secret_hash', 'permissions', 'last_used_at', 'expires_at'];
    protected $hidden = ['secret_hash'];
    
    public static function generate(): array
    {
        $key = 'sk_' . Str::random(32);
        $secret = Str::random(64);
        
        return [
            'key' => $key,
            'secret' => $secret,
            'secret_hash' => Hash::make($secret),
        ];
    }
    
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?? []);
    }
}

// app/Http/Middleware/AuthorizeApiKey.php
class AuthorizeApiKey
{
    public function handle($request, $next)
    {
        $key = $request->header('X-API-Key');
        $secret = $request->header('X-API-Secret');
        
        if (!$key || !$secret) {
            return response()->json(['error' => 'Missing API credentials'], 401);
        }
        
        $apiKey = ApiKey::where('key', $key)
            ->where('expires_at', '>', now())
            ->orWhere('expires_at', null)
            ->first();
        
        if (!$apiKey || !Hash::check($secret, $apiKey->secret_hash)) {
            Log::warning('Invalid API credentials', ['key' => substr($key, 0, 5) . '...']);
            return response()->json(['error' => 'Invalid API credentials'], 401);
        }
        
        // Set user for authorization
        $request->setUserResolver(fn() => $apiKey->user);
        $request->api_key = $apiKey;
        
        return $next($request);
    }
}

// Routes
Route::apiResource('api-keys', ApiKeyController::class);
Route::post('api-keys/{apiKey}/rotate', [ApiKeyController::class, 'rotate']);
Route::post('api-keys/{apiKey}/revoke', [ApiKeyController::class, 'revoke']);
```

---

### 💳 PAYMENT & BILLING (20 Features)

#### 1. Stripe Integration
**Status:** Nicht vorhanden | **Priority:** KRITISCH | **Aufwand:** 10 Tage

```php
// app/Services/PaymentService.php
class PaymentService
{
    protected StripeClient $stripe;
    
    public function createPaymentIntent(Invoice $invoice): array
    {
        $paymentIntent = $this->stripe->paymentIntents->create([
            'amount' => $invoice->amount_gross,
            'currency' => $invoice->currency,
            'customer' => $invoice->customer->stripe_customer_id ?? null,
            'description' => "Invoice #{$invoice->invoice_number}",
            'metadata' => [
                'invoice_id' => $invoice->id,
                'tenant_id' => $invoice->tenant_id,
            ],
            'automatic_payment_methods' => ['enabled' => true],
        ]);
        
        return [
            'client_secret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ];
    }
    
    public function handlePaymentWebhook(array $event): void
    {
        match($event['type']) {
            'payment_intent.succeeded' => $this->handlePaymentSuccess($event['data']['object']),
            'payment_intent.payment_failed' => $this->handlePaymentFailed($event['data']['object']),
            'charge.dispute.created' => $this->handleDispute($event['data']['object']),
            default => null,
        };
    }
    
    private function handlePaymentSuccess(object $paymentIntent): void
    {
        $invoice = Invoice::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        
        if ($invoice) {
            $invoice->markAsPaid();
            event(new PaymentReceived($invoice));
        }
    }
}

// app/Http/Controllers/PaymentController.php
Route::post('/payments/init-stripe', [PaymentController::class, 'initStripePayment']);
Route::post('/payments/confirm-stripe', [PaymentController::class, 'confirmPayment']);
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripeWebhook']);
```

---

#### 2. PayPal Integration
**Status:** Nicht vorhanden | **Priority:** MITTEL | **Aufwand:** 7 Tage

```php
// Similar to Stripe, but with PayPal SDK
composer require paypalrestsdk/paypalrestsdk

// app/Services/PayPalService.php
class PayPalService
{
    public function createPayment(Invoice $invoice): string
    {
        $payment = new Payment();
        $payment->setIntent('sale')
            ->setPayer($this->createPayer($invoice->customer))
            ->setRedirectUrls(...)
            ->setTransactions([
                (new Transaction())
                    ->setAmount($this->createAmount($invoice))
                    ->setDescription("Invoice #{$invoice->invoice_number}")
            ]);
        
        if ($payment->create()) {
            return $payment->getApprovalLink();
        }
    }
}
```

---

#### 3. SEPA Direct Debit
**Status:** Nicht vorhanden | **Priority:** HOCH (EU-Kunden) | **Aufwand:** 7 Tage

```php
// Stripe bietet SEPA support nativ
// Oder: moodletuition/sepa package

// app/Services/SepaService.php
class SepaService
{
    public function createSepaMandate(Customer $customer): void
    {
        // Create Stripe mandate
        $mandate = $this->stripe->mandates->create([
            'type' => 'sepa_debit',
            'customer' => $customer->stripe_customer_id,
        ]);
        
        $customer->update([
            'sepa_mandate_id' => $mandate->id,
            'sepa_mandate_accepted_at' => now(),
        ]);
    }
    
    public function chargeSepa(Invoice $invoice): void
    {
        $this->stripe->charges->create([
            'amount' => $invoice->amount_gross,
            'currency' => 'eur',
            'customer' => $invoice->customer->stripe_customer_id,
            'source' => $invoice->customer->sepa_mandate_id,
            'mandate' => $invoice->customer->sepa_mandate_id,
        ]);
    }
}
```

---

#### 4. Recurring Billing / Subscriptions
**Status:** Basis ✅ | **Needed:** Full automation  
**Aufwand:** 5 Tage

```php
// Erweitere bestehende Subscriptions
// database/migrations/*_enhance_subscriptions.php
Schema::table('subscriptions', function (Blueprint $table) {
    $table->enum('billing_cycle', ['monthly', 'quarterly', 'annual'])->default('monthly');
    $table->timestamp('next_billing_date')->nullable();
    $table->integer('failed_payment_attempts')->default(0);
    $table->timestamp('last_payment_attempt_at')->nullable();
});

// app/Jobs/ProcessSubscriptionBillings.php
class ProcessSubscriptionBillings implements ShouldQueue
{
    public function handle()
    {
        $subscriptions = Subscription::where('status', 'active')
            ->where('next_billing_date', '<=', now())
            ->get();
        
        foreach ($subscriptions as $subscription) {
            try {
                $invoice = $subscription->createInvoice();
                $paymentService->charge($invoice);
                $subscription->update(['next_billing_date' => now()->add($subscription->billing_cycle)]);
            } catch (PaymentException $e) {
                $subscription->increment('failed_payment_attempts');
                
                if ($subscription->failed_payment_attempts >= 3) {
                    $subscription->cancel();
                }
            }
        }
    }
}

// Cron: Kernel.php
$schedule->command('app:process-subscription-billings')->daily();
```

---

#### 5. Webhook System für Payment-Events
**Status:** Nicht vorhanden | **Priority:** KRITISCH | **Aufwand:** 5 Tage

```php
// database/migrations/*_create_webhooks_table.php
Schema::create('webhooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id');
    $table->string('url');
    $table->json('events'); // ['invoice.issued', 'payment.received', ...]
    $table->string('secret');
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_triggered_at')->nullable();
    $table->integer('failed_attempts')->default(0);
    $table->timestamps();
});

// app/Models/WebhookEvent.php
class WebhookEvent extends Model
{
    protected $fillable = ['webhook_id', 'event', 'payload', 'response_code', 'response_body'];
}

// app/Events/PaymentReceived.php
class PaymentReceived
{
    public function __construct(public Invoice $invoice) {}
}

// app/Listeners/NotifyWebhooks.php
class NotifyWebhooks
{
    public function handle(PaymentReceived $event)
    {
        $webhooks = Webhook::where('tenant_id', $event->invoice->tenant_id)
            ->where('is_active', true)
            ->whereJsonContains('events', 'payment.received')
            ->get();
        
        foreach ($webhooks as $webhook) {
            SendWebhookJob::dispatch($webhook, 'payment.received', [
                'invoice_id' => $event->invoice->id,
                'amount' => $event->invoice->amount_gross,
            ]);
        }
    }
}

// app/Jobs/SendWebhookJob.php
class SendWebhookJob implements ShouldQueue
{
    public function __construct(
        public Webhook $webhook,
        public string $event,
        public array $payload,
    ) {}
    
    public function handle()
    {
        $body = json_encode([
            'event' => $this->event,
            'timestamp' => now()->toIso8601String(),
            'data' => $this->payload,
        ]);
        
        $signature = hash_hmac('sha256', $body, $this->webhook->secret);
        
        try {
            $response = Http::withHeaders([
                'X-Webhook-Signature' => $signature,
                'X-Webhook-Event' => $this->event,
            ])
            ->timeout(10)
            ->retry(3, 100)
            ->post($this->webhook->url, json_decode($body, true));
            
            WebhookEvent::create([
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'payload' => $body,
                'response_code' => $response->status(),
                'response_body' => $response->body(),
            ]);
            
            if ($response->successful()) {
                $this->webhook->update(['last_triggered_at' => now()]);
            }
        } catch (\Exception $e) {
            Log::error('Webhook dispatch failed', [
                'webhook_id' => $this->webhook->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }
}

// API Routes
Route::apiResource('webhooks', WebhookController::class);
Route::get('webhooks/{webhook}/events', [WebhookController::class, 'getEvents']);
```

---

### 🌍 INTERNATIONALISIERUNG & MULTI-CURRENCY (12 Features)

#### 1. Automated Exchange Rates
**Status:** Nicht vorhanden | **Priority:** HOCH | **Aufwand:** 4 Tage

```php
// database/migrations/*_create_exchange_rates_table.php
Schema::create('exchange_rates', function (Blueprint $table) {
    $table->id();
    $table->string('from_currency', 3);
    $table->string('to_currency', 3);
    $table->decimal('rate', 10, 6);
    $table->enum('source', ['openexchangerates', 'fixer', 'ecb'])->default('ecb');
    $table->date('rate_date');
    $table->timestamp('fetched_at');
    $table->unique(['from_currency', 'to_currency', 'rate_date']);
    $table->timestamps();
});

// app/Services/ExchangeRateService.php
class ExchangeRateService
{
    public function getRate(string $from, string $to, ?Carbon $date = null): float
    {
        $date = $date ?? now()->startOfDay();
        
        $rate = ExchangeRate::where('from_currency', $from)
            ->where('to_currency', $to)
            ->where('rate_date', $date)
            ->first();
        
        if (!$rate) {
            throw new RateNotFoundException("Rate not found for $from/$to on $date");
        }
        
        return $rate->rate;
    }
    
    public function convert(int $amountCents, string $from, string $to, ?Carbon $date = null): int
    {
        if ($from === $to) return $amountCents;
        
        $rate = $this->getRate($from, $to, $date);
        return (int) round($amountCents * $rate);
    }
}

// app/Console/Commands/UpdateExchangeRates.php
class UpdateExchangeRates extends Command
{
    public function handle()
    {
        $provider = new OpenExchangeRatesProvider(config('services.openexchangerates.api_key'));
        
        foreach (['EUR', 'USD', 'GBP'] as $from) {
            foreach (['EUR', 'USD', 'GBP'] as $to) {
                if ($from === $to) continue;
                
                try {
                    $rate = $provider->getRate($from, $to);
                    
                    ExchangeRate::updateOrCreate(
                        [
                            'from_currency' => $from,
                            'to_currency' => $to,
                            'rate_date' => now()->startOfDay(),
                        ],
                        [
                            'rate' => $rate,
                            'source' => 'openexchangerates',
                            'fetched_at' => now(),
                        ]
                    );
                } catch (\Exception $e) {
                    Log::error('Exchange rate update failed', [
                        'from' => $from,
                        'to' => $to,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
}

// Kernel.php
$schedule->command('app:update-exchange-rates')->dailyAt('02:00');

// Usage
$service = new ExchangeRateService();
$usdAmount = $service->convert(15050, 'EUR', 'USD'); // 15050 EUR → USD
```

---

#### 2. Multi-Language Invoice Templates
**Status:** Partially ✅ | **Priority:** MITTEL | **Aufwand:** 5 Tage

```php
// database/migrations/*_add_language_to_invoices.php
Schema::table('invoices', function (Blueprint $table) {
    $table->string('language', 5)->default('de'); // de, en, fr, etc.
});

// resources/views/invoices/pdf-template-de.blade.php
// resources/views/invoices/pdf-template-en.blade.php
// resources/views/invoices/pdf-template-fr.blade.php

// app/Services/InvoicePdfGenerator.php
class InvoicePdfGenerator
{
    public function generatePdf(Invoice $invoice): string
    {
        $template = "invoices.pdf-template-{$invoice->language}";
        
        return Pdf::loadHTML(
            view($template, ['invoice' => $invoice])->render()
        )->output();
    }
}
```

---

### 📊 REPORTING & ANALYTICS (18 Features)

#### 1. Advanced Reporting Dashboard
**Status:** Basis ✅ | **Priority:** HOCH | **Aufwand:** 7 Tage

```php
// app/Services/ReportService.php
class ReportService
{
    public function getRevenueTrend(Tenant $tenant, int $months = 12): Collection
    {
        return Invoice::where('tenant_id', $tenant->id)
            ->where('status', '!=', 'draft')
            ->selectRaw('DATE_FORMAT(issued_at, "%Y-%m") as month, SUM(amount_gross) as revenue')
            ->groupByRaw('DATE_FORMAT(issued_at, "%Y-%m")')
            ->orderBy('month')
            ->limit($months)
            ->get();
    }
    
    public function getProfitMargin(Tenant $tenant, string $period = 'monthly'): float
    {
        $totalRevenue = Invoice::where('tenant_id', $tenant->id)
            ->where('status', 'paid')
            ->sum('amount_gross');
        
        $totalCosts = Expense::where('tenant_id', $tenant->id)
            ->sum('amount');
        
        if ($totalRevenue === 0) return 0;
        
        return round((($totalRevenue - $totalCosts) / $totalRevenue) * 100, 2);
    }
    
    public function getCustomerMetrics(Tenant $tenant): array
    {
        return [
            'total_customers' => Customer::where('tenant_id', $tenant->id)->count(),
            'active_customers' => Invoice::where('tenant_id', $tenant->id)
                ->where('issued_at', '>', now()->subMonths(3))
                ->distinct('customer_id')
                ->count(),
            'churn_rate' => $this->calculateChurnRate($tenant),
            'ltv' => $this->calculateLTV($tenant),
        ];
    }
}

// frontend/src/pages/DashboardPage.tsx
export const DashboardPage = () => {
    const { data: reports } = useQuery(['reports'], () => api.get('/reports/dashboard'));
    
    return (
        <div className="grid grid-cols-4 gap-4">
            <Card title="Revenue (MTD)" value={reports.revenue} />
            <Card title="Profit Margin" value={reports.margin}% />
            <Card title="Active Customers" value={reports.active_customers} />
            <Card title="Churn Rate" value={reports.churn_rate}% />
        </div>
    );
};
```

---

#### 2. Custom Report Builder
**Status:** Nicht vorhanden | **Priority:** MITTEL | **Aufwand:** 10 Tage

```php
// database/migrations/*_create_custom_reports_table.php
Schema::create('custom_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id');
    $table->string('name');
    $table->enum('type', ['invoice', 'customer', 'partner', 'project']);
    $table->json('filters'); // {date_from, date_to, status, ...}
    $table->json('columns'); // ['id', 'amount', 'customer_name', ...]
    $table->json('aggregations'); // {sum: ['amount'], count: ['*']}
    $table->timestamps();
});

// app/Models/CustomReport.php
class CustomReport extends Model implements BelongsToTenant
{
    use BelongsToTenant;
    
    public function execute(): Collection
    {
        $query = $this->buildQuery();
        return $query->get();
    }
    
    private function buildQuery()
    {
        $model = match($this->type) {
            'invoice' => Invoice::class,
            'customer' => Customer::class,
            'partner' => Partner::class,
            'project' => Project::class,
        };
        
        $query = $model::where('tenant_id', $this->tenant_id);
        
        // Apply filters
        foreach ($this->filters as $filter => $value) {
            if ($value === null) continue;
            
            match($filter) {
                'date_from' => $query->whereDate('issued_at', '>=', $value),
                'date_to' => $query->whereDate('issued_at', '<=', $value),
                'status' => $query->where('status', $value),
                'customer_id' => $query->where('customer_id', $value),
                default => $query->where($filter, $value),
            };
        }
        
        // Select columns
        $query->select($this->columns);
        
        return $query;
    }
}

// API
Route::apiResource('custom-reports', CustomReportController::class);
Route::post('custom-reports/{report}/execute', [CustomReportController::class, 'execute']);
Route::post('custom-reports/{report}/export', [CustomReportController::class, 'export']);
```

---

#### 3. Scheduled Report Email
**Status:** Nicht vorhanden | **Priority:** MITTEL | **Aufwand:** 4 Tage

```php
// database/migrations/*_create_scheduled_reports_table.php
Schema::create('scheduled_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id');
    $table->foreignId('custom_report_id');
    $table->json('recipients'); // [email1, email2, ...]
    $table->enum('frequency', ['daily', 'weekly', 'monthly'])->default('weekly');
    $table->time('scheduled_time')->default('08:00');
    $table->string('day_of_week')->nullable(); // For weekly
    $table->integer('day_of_month')->nullable(); // For monthly
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// app/Jobs/SendScheduledReport.php
class SendScheduledReport implements ShouldQueue
{
    public function __construct(public ScheduledReport $report) {}
    
    public function handle()
    {
        $data = $this->report->customReport->execute();
        
        $csv = $this->convertToCsv($data);
        
        foreach ($this->report->recipients as $email) {
            Mail::send(new ScheduledReportMail($this->report->customReport->name, $csv, $email));
        }
    }
}

// Kernel.php
$schedule->command('app:send-scheduled-reports')->daily();
```

---

### 🚀 AUTOMATION & WORKFLOWS (25 Features)

#### 1. Dunning/Mahnwesen Automation
**Status:** Basic ✅ | **Priority:** KRITISCH | **Aufwand:** 8 Tage

```php
// database/migrations/*_enhance_invoices_for_dunning.php
Schema::table('invoices', function (Blueprint $table) {
    $table->integer('reminder_level')->default(0);
    $table->timestamp('last_reminder_sent_at')->nullable();
    $table->timestamp('last_dunning_letter_sent_at')->nullable();
    $table->enum('dunning_status', ['active', 'paused', 'closed'])->default('active');
});

// app/Models/DunningTemplate.php
class DunningTemplate extends Model implements BelongsToTenant
{
    use BelongsToTenant;
    
    protected $fillable = [
        'level',
        'days_overdue',
        'email_template',
        'letter_template',
        'retry_days',
    ];
}

// app/Jobs/ProcessDunning.php
class ProcessDunning implements ShouldQueue
{
    public int $timeout = 300;
    
    public function handle()
    {
        $overdueInvoices = Invoice::where('status', 'issued')
            ->where('is_paid', false)
            ->whereRaw('DATE_ADD(due_date, INTERVAL reminder_level * 7 DAY) <= NOW()')
            ->get();
        
        foreach ($overdueInvoices as $invoice) {
            $newLevel = $this->calculateDunningLevel($invoice);
            
            if ($newLevel > $invoice->reminder_level) {
                $this->sendDunningNotification($invoice, $newLevel);
                
                $invoice->update([
                    'reminder_level' => $newLevel,
                    'last_reminder_sent_at' => now(),
                ]);
            }
            
            // Escalate to collections
            if ($newLevel >= 3 && $invoice->daysOverdue > 60) {
                event(new InvoiceEscalatedToCollections($invoice));
            }
        }
    }
    
    private function calculateDunningLevel(Invoice $invoice): int
    {
        $daysOverdue = $invoice->due_date->diffInDays(now());
        
        if ($daysOverdue < 7) return 0;
        if ($daysOverdue < 14) return 1;
        if ($daysOverdue < 30) return 2;
        return 3;
    }
    
    private function sendDunningNotification(Invoice $invoice, int $level): void
    {
        $template = DunningTemplate::where('tenant_id', $invoice->tenant_id)
            ->where('level', $level)
            ->first();
        
        if (!$template) return;
        
        // Send email
        Mail::send(new DunningNoticeMail($invoice, $template->email_template));
        
        // Send PDF letter
        if ($level >= 2) {
            GenerateDunningLetter::dispatch($invoice, $template);
        }
    }
}

// Kernel.php
$schedule->command('app:process-dunning')->daily();
```

---

#### 2. Automatic Invoice Reminder
**Status:** Nicht vorhanden | **Priority:** HOCH | **Aufwand:** 3 Tage

```php
// app/Jobs/SendInvoiceReminders.php
class SendInvoiceReminders implements ShouldQueue
{
    public function handle()
    {
        // Send reminders 3 days before due date
        Invoice::where('status', 'issued')
            ->where('is_paid', false)
            ->whereRaw('DATE_SUB(due_date, INTERVAL 3 DAY) = CURDATE()')
            ->each(function (Invoice $invoice) {
                Mail::send(new InvoiceReminderMail($invoice));
                
                $invoice->update(['reminder_sent_at' => now()]);
            });
    }
}

// Kernel.php
$schedule->command('app:send-invoice-reminders')->daily();
```

---

#### 3. Automatic Project Status Updates
**Status:** Nicht vorhanden | **Priority:** MITTEL | **Aufwand:** 5 Tage

```php
// app/Jobs/UpdateProjectStatus.php
class UpdateProjectStatus implements ShouldQueue
{
    public function handle()
    {
        Project::where('status', 'in_progress')->each(function (Project $project) {
            $completedPositions = $project->positions()
                ->where('status', 'completed')
                ->count();
            
            $totalPositions = $project->positions()->count();
            
            if ($completedPositions === $totalPositions) {
                $project->update(['status' => 'completed']);
                event(new ProjectCompleted($project));
            }
        });
    }
}
```

---

#### 4. Workflow Builder (Low-Code)
**Status:** Nicht vorhanden | **Priority:** MITTEL | **Aufwand:** 15 Tage

```php
// database/migrations/*_create_workflows_table.php
Schema::create('workflows', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id');
    $table->string('name');
    $table->enum('trigger', ['invoice.issued', 'payment.received', 'project.completed', 'customer.created']);
    $table->json('steps'); // [{ action: 'send_email', params: {...} }, ...]
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// Example workflow:
// Trigger: invoice.issued
// Steps:
//   1. Send email to customer
//   2. Add task: "Follow up on invoice X"
//   3. Wait 7 days
//   4. If not paid: Send reminder
//   5. If paid: Mark task as completed

// app/Services/WorkflowEngine.php
class WorkflowEngine
{
    public function execute(Workflow $workflow, array $context): void
    {
        foreach ($workflow->steps as $step) {
            $this->executeStep($step, $context);
        }
    }
    
    private function executeStep(array $step, array $context): void
    {
        match($step['action']) {
            'send_email' => $this->sendEmail($step['params'], $context),
            'create_task' => $this->createTask($step['params'], $context),
            'update_status' => $this->updateStatus($step['params'], $context),
            'call_webhook' => $this->callWebhook($step['params'], $context),
            default => null,
        };
    }
}
```

---

### 🔐 COMPLIANCE & AUDIT (20 Features)

#### 1. GDPR Compliance
**Status:** Partial | **Priority:** KRITISCH | **Aufwand:** 10 Tage

```php
// database/migrations/*_add_gdpr_columns.php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('gdpr_consent_given')->default(false);
    $table->timestamp('gdpr_consent_date')->nullable();
    $table->text('gdpr_consent_ip')->nullable();
    $table->boolean('marketing_consent')->default(false);
});

// app/Services/GdprService.php
class GdprService
{
    public function anonymizeUser(User $user): void
    {
        // Hash personal data
        $user->update([
            'first_name' => 'Anonymous',
            'last_name' => 'User',
            'email' => 'deleted-' . Str::random(10) . '@example.com',
            'phone' => null,
        ]);
        
        // Delete personal data
        $user->tokens()->delete();
        ActivityLog::where('causer_id', $user->id)->delete();
    }
    
    public function exportUserData(User $user): array
    {
        return [
            'user' => $user,
            'activities' => ActivityLog::where('causer_id', $user->id)->get(),
            'invoices' => Invoice::where('user_id', $user->id)->get(),
            'customers' => Customer::where('created_by', $user->id)->get(),
        ];
    }
}

// Routes
Route::post('/gdpr/export', [GdprController::class, 'export']);
Route::post('/gdpr/delete', [GdprController::class, 'anonymize']);
```

---

#### 2. GoBD Compliance (für Deutschland)
**Status:** Partial ✅ | **Priority:** KRITISCH | **Aufwand:** 5 Tage

```php
// Invoices are already immutable ✅
// But ensure:

// 1. Immutability after issue
class Invoice extends Model
{
    protected static function booted()
    {
        static::updating(function ($invoice) {
            if ($invoice->is_locked && !auth()->user()?->is_admin) {
                throw new ModelException('Locked invoices cannot be modified');
            }
        });
    }
}

// 2. Hash chain for audit trail
class InvoiceAuditLog extends Model
{
    protected $fillable = ['invoice_id', 'action', 'changes', 'hash'];
    
    public static function logChange(Invoice $invoice, string $action, array $changes): void
    {
        $previousHash = self::where('invoice_id', $invoice->id)->latest()->first()?->hash ?? 'initial';
        
        $newHash = hash('sha256', $previousHash . json_encode($changes));
        
        self::create([
            'invoice_id' => $invoice->id,
            'action' => $action,
            'changes' => json_encode($changes),
            'hash' => $newHash,
        ]);
    }
}
```

---

---

## PERFORMANCE-OPTIMIERUNGEN

### Frontend (10 Items)

#### 1. **Code Splitting mit React.lazy()**

```typescript
// ❌ Before
import DashboardPage from '@/pages/DashboardPage';
import InvoicesPage from '@/pages/InvoicesPage';

// ✅ After
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const InvoicesPage = React.lazy(() => import('@/pages/InvoicesPage'));

const router = createBrowserRouter([
    {
        path: '/dashboard',
        element: (
            <Suspense fallback={<LoadingSpinner />}>
                <DashboardPage />
            </Suspense>
        ),
    },
]);

// Result: Initial bundle size: 100KiB → 40KiB (+60% faster load)
```

---

#### 2. **Image Lazy Loading**

```typescript
<img
    src={logo}
    loading="lazy"
    decoding="async"
    width={200}
    height={200}
/>
```

---

#### 3. **React.memo für Pure Components**

```typescript
const DataTable = React.memo(
    ({ columns, data }: Props) => {
        return <table>{/* ... */}</table>;
    },
    (prev, next) => {
        // Custom comparison
        return (
            prev.columns === next.columns &&
            prev.data === next.data
        );
    }
);
```

---

### Backend (15 Items)

#### 1. **N+1 Query Optimization**

```php
// ❌ Before: 1 + 50 + 50 = 101 queries!
$invoices = Invoice::with(['items', 'auditLogs.user'])->paginate(50);

// ✅ After: 3 queries
$invoices = Invoice::with([
    'items:invoice_id,description,amount_net',
    'latestAuditLog:invoice_id,action,user_id',
    'latestAuditLog.user:id,name',
])
->select('id', 'invoice_number', 'amount_gross', 'status')
->paginate(50);
```

---

#### 2. **Database Indexing**

```php
// database/migrations/*_add_indexes.php
Schema::table('invoices', function (Blueprint $table) {
    $table->index(['tenant_id', 'status']); // Composite index
    $table->index(['issued_at']);
    $table->index(['customer_id']);
    $table->index(['user_id']);
    $table->fullText(['invoice_number']); // Full-text search
});

// Result: Query time 800ms → 20ms (40x faster)
```

---

#### 3. **Query Pagination**

```php
// ❌ Before
$invoices = Invoice::where('tenant_id', $tenantId)->get(); // Alle Rows!

// ✅ After
$invoices = Invoice::where('tenant_id', $tenantId)->paginate(50);

// Result: Memory 200MB → 5MB
```

---

#### 4. **Eager Load Relations**

```php
// ✅ Always load needed relations
$customers = Customer::with('invoices', 'partners')
    ->where('tenant_id', $tenantId)
    ->get();
```

---

---

## INFRASTRUKTUR & DEVOPS

### Docker Containerization (10 Items)

#### 1. **Docker Compose für Lokale Entwicklung**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - APP_KEY=${APP_KEY}
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=tms_office
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  frontend:
    build:
      context: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app

volumes:
  mysql_data:
```

```dockerfile
# backend/Dockerfile
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libjpeg-dev libfreetype6-dev \
    libzip-dev unzip mysql-client redis-tools

RUN docker-php-ext-install pdo_mysql redis zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --optimize-autoloader --no-dev

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
```

---

### CI/CD Pipeline (15 Items)

#### 1. **GitHub Actions Setup**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: tms_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: pdo_mysql, redis, zip
      
      - name: Install Dependencies
        run: composer install
      
      - name: Setup Environment
        run: |
          cp .env.example .env.testing
          php artisan key:generate --env=testing
          php artisan migrate --env=testing
      
      - name: Run Tests
        run: composer test
      
      - name: Run Linter
        run: ./vendor/bin/pint --check
      
      - name: Security Scan
        run: |
          composer audit
          npm audit --audit-level=moderate
```

---

#### 2. **Security Scanning**

```yaml
# .github/workflows/security.yml
name: Security

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
      
      - name: PHP Security Check
        run: |
          composer require --dev enlightn/security-checker
          ./vendor/bin/security-checker security:check composer.lock
      
      - name: NPM Audit
        run: npm audit --audit-level=moderate
      
      - name: OWASP Dependency Check
        run: |
          docker run --rm -v "$(pwd)":/src \
            owasp/dependency-check \
            --scan /src --format JSON
```

---

---

## TESTING & QA

### Backend Testing (15 Items)

#### 1. **Feature Tests für alle Endpoints**

```php
// tests/Feature/InvoiceApiTest.php
class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_user_can_create_invoice()
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['tenant_id' => $user->tenant_id]);
        
        $response = $this->actingAs($user)->postJson('/api/invoices', [
            'customer_id' => $customer->id,
            'items' => [
                ['description' => 'Translation service', 'amount_net' => 10000],
            ],
        ]);
        
        $response->assertStatus(201);
        $this->assertDatabaseHas('invoices', [
            'customer_id' => $customer->id,
        ]);
    }
    
    public function test_user_cannot_view_other_tenant_invoice()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $invoice = Invoice::factory()->create(['tenant_id' => $user1->tenant_id]);
        
        $response = $this->actingAs($user2)->getJson("/api/invoices/{$invoice->id}");
        
        $response->assertStatus(403);
    }
    
    public function test_locked_invoice_cannot_be_modified()
    {
        $user = User::factory()->create();
        $invoice = Invoice::factory()
            ->create(['tenant_id' => $user->tenant_id, 'is_locked' => true]);
        
        $response = $this->actingAs($user)->putJson("/api/invoices/{$invoice->id}", [
            'amount_gross' => 20000,
        ]);
        
        $response->assertStatus(422);
    }
}
```

---

### Frontend Testing (10 Items)

#### 1. **Vitest + Testing Library**

```typescript
// frontend/src/components/__tests__/DataTable.test.tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/common/DataTable';

describe('DataTable', () => {
    it('renders columns correctly', () => {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
        ];
        
        const data = [
            { id: 1, name: 'Invoice #1' },
            { id: 2, name: 'Invoice #2' },
        ];
        
        render(<DataTable columns={columns} data={data} />);
        
        expect(screen.getByText('Invoice #1')).toBeInTheDocument();
        expect(screen.getByText('Invoice #2')).toBeInTheDocument();
    });
});
```

---

---

## DOKUMENTATION

### 1. **API Documentation (OpenAPI/Swagger)**

```php
// Install Laravel Docs
composer require --dev scribe-php/scribe

// Generate
php artisan scribe:generate

// Output: docs/index.html mit interaktiver API-Dokumentation
```

---

### 2. **Developer Guide**

```markdown
# API Developer Guide

## Authentication

All endpoints require Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/api/invoices
```

## Rate Limiting

- Authenticated: 60 requests/min
- Admin: 120 requests/min
- Bulk Operations: 10 requests/min

Headers returned:
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

## Pagination

```json
GET /api/invoices?page=2&per_page=50

{
  "data": [...],
  "meta": {
    "current_page": 2,
    "total": 1000,
    "per_page": 50
  }
}
```
```

---

---

## PRIORISIERUNGS-MATRIX

| Phase | Feature | Aufwand | Business Impact | Risk | Priorität |
|-------|---------|---------|-----------------|------|-----------|
| 1 | APP_DEBUG=false | 30min | KRITISCH | 🔴 | 🔴 SOFORT |
| 1 | HttpOnly Cookies | 3-4d | KRITISCH | 🔴 | 🔴 SOFORT |
| 1 | Reverb TLS | 2-3d | KRITISCH | 🔴 | 🔴 SOFORT |
| 1 | CORS Fix | 2-3h | HOCH | 🔴 | 🔴 SOFORT |
| 1 | Token Expiration | 1-2d | HOCH | 🔴 | 🔴 SOFORT |
| 1 | Password Reset Expiration | 1-2d | HOCH | 🔴 | 🔴 SOFORT |
| 1 | Data Encryption | 2-3d | HOCH | 🔴 | 🔴 SOFORT |
| 1 | 2FA Recovery Hashing | 1-2d | HOCH | 🔴 | 🔴 SOFORT |
| 1 | Bulk Rate Limiting | 1d | HOCH | 🔴 | 🔴 SOFORT |
| 2 | Async Logging | 2-3d | MITTEL | 🟠 | 🟠 KW 2 |
| 2 | Redis Caching | 2-3d | HOCH | 🟠 | 🟠 KW 2 |
| 2 | Async PDF Gen | 2-3d | MITTEL | 🟠 | 🟠 KW 2 |
| 2 | Input Sanitization | 1-2d | MITTEL | 🟠 | 🟠 KW 3 |
| 3 | Payment Integration | 10d | KRITISCH | 🟢 | 🟢 KW 4-5 |
| 3 | Webhook System | 5d | HOCH | 🟢 | 🟢 KW 4 |
| 4 | API Docs | 3d | MITTEL | 🟢 | 🟢 KW 8 |
| 4 | Dunning Automation | 8d | HOCH | 🟢 | 🟢 KW 6-7 |

---

## CHECKLISTEN ZUR UMSETZUNG

### Sicherheits-Deployment Checklist

```markdown
# Security Hardening Checklist

## Pre-Deployment
- [ ] Code Review durchgeführt
- [ ] Tests bestanden (100% kritische Paths)
- [ ] Backup erstellt
- [ ] Rollback-Plan dokumentiert

## Deployment
- [ ] Notifications an Team gesendet
- [ ] Monitoring aktiviert
- [ ] Health-Checks überprüft
- [ ] SSL/TLS überprüft

## Post-Deployment
- [ ] Smoke Tests durchgeführt
- [ ] Logs überprüft (keine Errors)
- [ ] Performance überprüft
- [ ] Security Scan durchgeführt
- [ ] Stakeholder notifiziert

## Rollback (if needed)
- [ ] Database Rollback durchgeführt
- [ ] Cache geleert
- [ ] CDN gecleint
- [ ] Monitoring überprüft
```

---

**DOKUMENT ENDE**

**Nächste Schritte:**
1. Priorität-Matrix mit Team besprechen
2. Sprint-Planung basierend auf 4-Wochen-Zyklen
3. Resource-Allocation: Backend/Frontend/DevOps
4. Weekly Review aller in-progress Items
5. Security Audit nach Phase 1

**Kontakt für Fragen:** engineering-lead@your-domain.com
