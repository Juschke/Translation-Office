<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * InvoiceAuditLog — GoBD Audit Trail
 *
 * Immutable log of all actions performed on invoices.
 * Records are append-only: never update or delete.
 * Required by GoBD: "Wer hat wann welchen Status geändert?"
 */
class InvoiceAuditLog extends Model
{
    // Disable updated_at since audit logs are immutable (append-only)
    const UPDATED_AT = null;

    protected $fillable = [
        'invoice_id',
        'user_id',
        'action',
        'old_status',
        'new_status',
        'metadata',
        'ip_address',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Known action types.
     */
    public const ACTION_CREATED       = 'created';
    public const ACTION_ISSUED        = 'issued';
    public const ACTION_SENT          = 'sent';
    public const ACTION_PAID          = 'paid';
    public const ACTION_CANCELLED     = 'cancelled';
    public const ACTION_REMINDER_SENT = 'reminder_sent';
    public const ACTION_DOWNLOADED    = 'downloaded';

    // ─── Relationships ───────────────────────────────────────────────

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
