<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasSequentialCode
{
    /**
     * Boot the trait to add a creating observer.
     */
    public static function bootHasSequentialCode()
    {
        static::creating(function ($model) {
            $column = $model->getSequentialCodeColumn();

            if (!$model->$column) {
                $model->generateSequentialCode();
            }
        });
    }

    /**
     * Generate the next sequential code for the model.
     * Simply returns a 3-digit padded number.
     */
    public function generateSequentialCode()
    {
        $column = $this->getSequentialCodeColumn();

        $lastRecord = static::where('tenant_id', $this->tenant_id)
            ->where($column, 'regexp', '^[0-9]+$')
            ->orderByRaw("CAST($column AS UNSIGNED) DESC")
            ->first();

        $nextNumber = 1;
        if ($lastRecord && $lastRecord->$column) {
            $nextNumber = (int) $lastRecord->$column + 1;
        }

        $this->$column = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        return $this->$column;
    }

    /**
     * Get the column name used for storing the code.
     */
    protected function getSequentialCodeColumn()
    {
        if (class_basename($this) === 'Service') {
            return 'service_code';
        }
        return 'code';
    }
}
