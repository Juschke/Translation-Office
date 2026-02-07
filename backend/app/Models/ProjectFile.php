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
        'file_name',
        'mime_type',
        'extension',
        'file_size',
        'word_count',
        'char_count',
        'version',
        'status',
        'uploaded_by',
    ];

    protected $appends = ['file_name'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader()
    {
        return $this->belongsTo(\App\Models\User::class, 'uploaded_by');
    }

    // Accessor to ensure file_name is always available
    public function getFileNameAttribute($value)
    {
        return $value ?: $this->original_name;
    }
}
