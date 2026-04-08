<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RecurringInvoice extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'customer_id',
        'template_invoice_id',
        'interval',
        'next_run_at',
        'last_run_at',
        'occurrences_limit',
        'occurrences_count',
        'status',
        'auto_issue',
        'due_days',
        'notes',
        'template_items',
        'template_customer_id',
        'template_customer_name',
        'template_amount_net_cents',
        'template_tax_rate',
        'template_amount_tax_cents',
        'template_amount_gross_cents',
        'template_currency',
        'template_intro_text',
        'template_footer_text',
        'template_notes',
    ];

    protected $casts = [
        'next_run_at'               => 'date',
        'last_run_at'               => 'date',
        'auto_issue'                => 'boolean',
        'template_items'            => 'array',
        'template_tax_rate'         => 'decimal:2',
        'template_amount_net_cents' => 'integer',
        'template_amount_tax_cents' => 'integer',
        'template_amount_gross_cents' => 'integer',
        'occurrences_count'         => 'integer',
        'occurrences_limit'         => 'integer',
        'due_days'                  => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function templateInvoice()
    {
        return $this->belongsTo(Invoice::class, 'template_invoice_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDueForExecution($query)
    {
        return $query->active()->where('next_run_at', '<=', today());
    }

    public function calculateNextRunDate(Carbon $from = null): Carbon
    {
        $base = $from ?? Carbon::today();
        return match ($this->interval) {
            'monthly'   => $base->copy()->addMonth(),
            'quarterly' => $base->copy()->addMonths(3),
            'yearly'    => $base->copy()->addYear(),
            default     => $base->copy()->addMonth(),
        };
    }

    public function createInvoice(): Invoice
    {
        $dueDate = Carbon::today()->addDays($this->due_days);

        // Snapshot customer for new invoice
        $customer = Customer::withoutGlobalScopes()->find($this->template_customer_id);

        $invoice = Invoice::withoutGlobalScopes()->create([
            'tenant_id'              => $this->tenant_id,
            'customer_id'            => $this->template_customer_id,
            'status'                 => $this->auto_issue ? 'issued' : 'draft',
            'date'                   => today(),
            'due_date'               => $dueDate,
            'currency'               => $this->template_currency,
            'amount_net'             => $this->template_amount_net_cents,
            'tax_rate'               => $this->template_tax_rate,
            'amount_tax'             => $this->template_amount_tax_cents,
            'amount_gross'           => $this->template_amount_gross_cents,
            'intro_text'             => $this->template_intro_text,
            'footer_text'            => $this->template_footer_text,
            'notes'                  => $this->template_notes,
            'snapshot_customer_name'         => $customer?->company_name ?? trim(($customer?->first_name ?? '') . ' ' . ($customer?->last_name ?? '')),
            'snapshot_customer_email'        => $customer?->email,
            'snapshot_customer_address'      => $customer?->address_street,
            'snapshot_customer_zip'          => $customer?->address_zip,
            'snapshot_customer_city'         => $customer?->address_city,
            'snapshot_customer_country'      => $customer?->address_country,
            'snapshot_customer_tax_id'       => $customer?->tax_id,
            'recurring_invoice_id'           => $this->id,
        ]);

        // Create invoice items from template
        foreach ($this->template_items as $item) {
            $invoice->items()->create([
                'tenant_id'   => $this->tenant_id,
                'description' => $item['description'] ?? '',
                'quantity'    => $item['quantity'] ?? 1,
                'unit'        => $item['unit'] ?? 'Stk.',
                'unit_price'  => $item['unit_price'] ?? 0,
                'tax_rate'    => $item['tax_rate'] ?? $this->template_tax_rate,
                'amount_net'  => $item['amount_net'] ?? 0,
                'amount_tax'  => $item['amount_tax'] ?? 0,
                'amount_gross' => $item['amount_gross'] ?? 0,
            ]);
        }

        // Update tracking fields
        $this->update([
            'last_run_at'        => today(),
            'next_run_at'        => $this->calculateNextRunDate(),
            'occurrences_count'  => $this->occurrences_count + 1,
            'status'             => $this->occurrences_limit && ($this->occurrences_count + 1) >= $this->occurrences_limit
                                    ? 'paused'
                                    : 'active',
        ]);

        return $invoice;
    }
}
