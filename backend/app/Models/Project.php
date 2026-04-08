<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\BelongsToTenant;
use App\Traits\LogsAllActivity;

class Project extends Model
{
    use HasFactory, BelongsToTenant, LogsAllActivity, \App\Traits\HasDisplayId;

    protected $appends = ['display_id'];

    protected static function booted()
    {
        static::creating(function ($project) {
            if (empty($project->access_token)) {
                $project->access_token = \Illuminate\Support\Str::random(32);
            }
            if (empty($project->partner_access_token)) {
                $project->partner_access_token = \Illuminate\Support\Str::random(32);
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    protected $fillable = [
        'project_number',
        'custom_id',
        'customer_id',
        'partner_id',
        'source_lang_id',
        'target_lang_id',
        'document_type_id',
        'additional_doc_types',
        'project_name',
        'status',
        'access_token',
        'partner_access_token',
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
        'certified_count',
        'apostille_count',
        'express_count',
        'classification_count',
        'copies_count',
        'copy_price',
        'notes',
        'appointment_location',
        'customer_reference',
        'customer_date',
        // Extra service prices
        'certified_price',
        'apostille_price',
        'express_price',
        'classification_price',
        // Extra service units
        'certified_unit',
        'apostille_unit',
        'express_unit',
        'classification_unit',
        'copies_unit',
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
        'copy_price' => 'decimal:2',
        'certified_price' => 'decimal:2',
        'apostille_price' => 'decimal:2',
        'express_price' => 'decimal:2',
        'classification_price' => 'decimal:2',
        'down_payment_date' => 'datetime',
        'customer_date' => 'datetime',
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

    public function invoices()
    {
        return $this->hasMany(Invoice::class)
            ->whereNotIn('status', ['deleted'])
            ->orderBy('created_at', 'desc');
    }
}
