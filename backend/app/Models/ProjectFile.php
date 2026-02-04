<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectFile extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'project_id',
        'type',
        'path',
        'original_name',
        'word_count',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
