<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MailAccount extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'smtp_host',
        'smtp_port',
        'smtp_encryption',
        'incoming_protocol',
        'imap_host',
        'imap_port',
        'imap_encryption',
        'username',
        'password',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'password' => 'encrypted',
    ];

    public function signatures()
    {
        return $this->hasMany(MailSignature::class);
    }
}
