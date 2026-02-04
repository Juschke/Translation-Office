<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'customer_id',
        'source_lang_id',
        'target_lang_id',
        'document_type_id',
        'project_name',
        'status',
        'word_count',
        'line_count',
        'price_total',
        'currency',
        'deadline',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sourceLanguage()
    {
        return $this->belongsTo(Language::class, 'source_lang_id');
    }

    public function targetLanguage()
    {
        return $this->belongsTo(Language::class, 'target_lang_id');
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }
}
