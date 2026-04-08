<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DunningSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'level1_days_after_due', 'level1_fee_cents', 'level1_subject', 'level1_body',
        'level2_days_after_due', 'level2_fee_cents', 'level2_subject', 'level2_body',
        'level3_days_after_due', 'level3_fee_cents', 'level3_subject', 'level3_body',
        'auto_escalate',
    ];

    protected $casts = [
        'auto_escalate' => 'boolean',
        'level1_days_after_due' => 'integer',
        'level1_fee_cents' => 'integer',
        'level2_days_after_due' => 'integer',
        'level2_fee_cents' => 'integer',
        'level3_days_after_due' => 'integer',
        'level3_fee_cents' => 'integer',
    ];

    public function getLevelConfig(int $level): array
    {
        return [
            'days_after_due' => $this->{"level{$level}_days_after_due"},
            'fee_cents'      => $this->{"level{$level}_fee_cents"},
            'subject'        => $this->{"level{$level}_subject"},
            'body'           => $this->{"level{$level}_body"},
        ];
    }
}
