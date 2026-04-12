# Performance Optimization Guide

## N+1 Query Optimization

### Problem
```php
// ❌ BAD: Causes N+1 queries
$invoices = Invoice::paginate(50);
foreach ($invoices as $invoice) {
    echo $invoice->customer->name;  // +1 query per invoice!
}
// Total: 1 (invoices) + 50 (customers) = 51 queries!
```

### Solution
```php
// ✅ GOOD: Eager loading
$invoices = Invoice::with(['customer', 'items', 'tenant'])->paginate(50);
foreach ($invoices as $invoice) {
    echo $invoice->customer->name;  // No additional queries!
}
// Total: 3 queries (invoices + customers + items)
```

### Best Practices

#### 1. Select Specific Columns
```php
// ✅ Select only needed columns
$invoices = Invoice::with([
    'customer:id,name,email',  // Only these columns
    'items:invoice_id,description,amount_net',
])
->select('id', 'invoice_number', 'amount_gross', 'status')
->paginate(50);
```

#### 2. Nested Relations
```php
// ✅ Load nested relations
$invoices = Invoice::with([
    'customer' => function ($query) {
        $query->select('id', 'name', 'email');
    },
    'items' => function ($query) {
        $query->select('invoice_id', 'description', 'amount_net');
    },
])
->select('id', 'invoice_number', 'status')
->paginate(50);
```

#### 3. Conditional Loading
```php
// ✅ Load relations conditionally
$invoices = Invoice::query()
    ->when(request('include_items'), function ($query) {
        $query->with('items');
    })
    ->when(request('include_customer'), function ($query) {
        $query->with('customer');
    })
    ->paginate(50);
```

#### 4. Model Scopes
```php
// In Model:
public function scopeWithRelations(Builder $query)
{
    return $query->with([
        'customer:id,name,email',
        'items:invoice_id,description,amount_net',
        'tenant:id,company_name',
    ]);
}

// In Controller:
$invoices = Invoice::withRelations()->paginate(50);
```

### Key Models to Optimize

#### Invoice
```php
Invoice::with([
    'customer:id,name,email',
    'items:invoice_id,description,amount_net',
    'tenant:id,company_name',
    'project:id,project_name',
])->select('id', 'invoice_number', 'amount_gross', 'status', 'customer_id', 'tenant_id', 'project_id')
->paginate(50);
```

#### Customer
```php
Customer::with([
    'priceMatrix:id,name',
    'projects:id,project_name,customer_id',
])->select('id', 'first_name', 'last_name', 'company_name', 'email', 'price_matrix_id')
->paginate(50);
```

#### Project
```php
Project::with([
    'customer:id,name,email',
    'partner:id,company,email',
    'files:id,project_id,name',
])->select('id', 'project_name', 'project_number', 'status', 'customer_id', 'partner_id')
->paginate(50);
```

---

## Caching Strategy

### 1. Short-Term Cache (5 min)
- Dashboard stats
- Report data
- Frequently accessed lists

```php
Cache::remember('report:revenue:' . $tenantId . ':' . date('Y-m'), 5*60, function () {
    return Invoice::where(...)->sum('amount_gross');
});
```

### 2. Medium-Term Cache (30 min)
- Customer/Partner lists
- Project data
- Settings

```php
Cache::remember('customers:' . $tenantId, 30*60, function () {
    return Customer::where('tenant_id', $tenantId)->get();
});
```

### 3. Long-Term Cache (24h)
- Master data (languages, currencies)
- Static reference data
- Price matrices

```php
Cache::remember('master:languages:' . $tenantId, 24*60*60, function () {
    return Language::where('tenant_id', $tenantId)->get();
});
```

### Cache Invalidation
```php
// When data changes, invalidate related caches
public static function booted()
{
    static::created(function ($invoice) {
        Cache::forget('report:revenue:' . $invoice->tenant_id . ':' . now()->format('Y-m'));
    });
}
```

---

## Database Indexing

### Recommended Indexes
```php
// In migrations
Schema::table('invoices', function (Blueprint $table) {
    $table->index(['tenant_id', 'status']);  // Composite index
    $table->index(['customer_id']);
    $table->index(['issued_at']);
    $table->fullText(['invoice_number']);  // Full-text search
});

Schema::table('projects', function (Blueprint $table) {
    $table->index(['tenant_id', 'status']);
    $table->index(['customer_id']);
    $table->index(['project_name']);
});
```

---

## Async Jobs

### Use Cases
- ✅ PDF generation
- ✅ Email sending
- ✅ IMAP sync
- ✅ API logging
- ✅ Export generation
- ✅ Image processing

### Implementation
```php
// Dispatch async job
GenerateInvoicePdf::dispatch($invoice);

// In job:
public function handle()
{
    // Long-running task
    $pdf = Pdf::loadHTML($html)->output();
    Storage::put($filePath, $pdf);
    
    // Notify via event
    event(new InvoicePdfGenerated($invoice));
}
```

---

## Monitoring Performance

### Query Logging
```php
// In development, log slow queries
DB::listen(function ($query) {
    if ($query->time > 1000) {  // > 1 second
        Log::warning('Slow query', [
            'sql' => $query->sql,
            'time' => $query->time . 'ms',
        ]);
    }
});
```

### API Response Times
```php
// Log response times via ApiRequestLog
// Available in: storage/logs/api-requests.log
```

---

## Common Anti-Patterns to Avoid

```php
// ❌ DON'T: Load all columns if not needed
Customer::select('*')->get();

// ✅ DO: Select specific columns
Customer::select('id', 'name', 'email')->get();

// ❌ DON'T: Loop and query in callback
$customers->each(function ($customer) {
    $invoices = Invoice::where('customer_id', $customer->id)->get();
});

// ✅ DO: Use relation grouping
$customers = Customer::with('invoices')->get();

// ❌ DON'T: Touch in loop
foreach ($records as $record) {
    $record->touch();  // +1 query!
}

// ✅ DO: Update in batch
Record::whereIn('id', $ids)->update(['updated_at' => now()]);
```

---

## Performance Targets

- API response time: < 200ms
- Dashboard load: < 500ms
- List pagination: < 300ms
- PDF generation: async (< 10s in background)
- Cache hit rate: > 70%
- Database queries per request: < 5

