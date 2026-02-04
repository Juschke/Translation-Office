<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceMatrix extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'source_lang_id',
        'target_lang_id',
        'currency',
        'price_per_word',
        'price_per_line',
        'minimum_charge',
        'hourly_rate',
    ];

    public function sourceLanguage()
    {
        return $this->belongsTo(Language::class, 'source_lang_id');
    }

    public function targetLanguage()
    {
        return $this->belongsTo(Language::class, 'target_lang_id');
    }
}
