<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mail extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'mail_account_id',
        'message_id',
        'folder',
        'from_email',
        'to_emails',
        'cc_emails',
        'subject',
        'body',
        'is_read',
        'attachments',
        'date',
    ];

    protected $casts = [
        'to_emails' => 'array',
        'cc_emails' => 'array',
        'is_read' => 'boolean',
        'attachments' => 'array',
        'date' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(MailAccount::class, 'mail_account_id');
    }
}
