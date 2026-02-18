<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\BelongsToTenant;
use App\Traits\LogsAllActivity;

class Project extends Model
{
    use HasFactory, BelongsToTenant, LogsAllActivity;

    protected $fillable = [
        'project_number',
        'customer_id',
        'partner_id',
        'source_lang_id',
        'target_lang_id',
        'document_type_id',
        'additional_doc_types',
        'project_name',
        'status',
        'access_token',
        'priority',
        'word_count',
        'line_count',
        'price_total',
        'partner_cost_net',
        'down_payment',
        'down_payment_date',
        'down_payment_note',
        'currency',
        'deadline',
        'is_certified',
        'has_apostille',
        'is_express',
        'classification',
        'copies_count',
        'copy_price',
        'notes',
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'additional_doc_types' => 'array',
        'is_certified' => 'boolean',
        'has_apostille' => 'boolean',
        'is_express' => 'boolean',
        'classification' => 'boolean',
        'price_total' => 'decimal:2',
        'partner_cost_net' => 'decimal:2',
        'down_payment' => 'decimal:2',
        'copy_price' => 'decimal:4',
        'down_payment_date' => 'datetime',
    ];

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function sourceLanguage()
    {
        return $this->belongsTo(Language::class, 'source_lang_id');
    }

    public function targetLanguage()
    {
        return $this->belongsTo(Language::class, 'target_lang_id');
    }

    public function positions()
    {
        return $this->hasMany(ProjectPosition::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function payments()
    {
        return $this->hasMany(ProjectPayment::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
