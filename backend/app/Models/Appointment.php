<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\BelongsToTenant;
use App\Traits\LogsAllActivity;

class Appointment extends Model
{
    use HasFactory, BelongsToTenant, LogsAllActivity, \App\Traits\HasDisplayId;

    protected $appends = ['display_id'];

    protected $fillable = [
        'tenant_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'type',
        'location',
        'project_id',
        'customer_id',
        'partner_id',
        'user_id',
        'status',
        'color',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
