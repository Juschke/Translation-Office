<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait für optimierte Queries - verhindert N+1 Problem
 * Kann in Modellen verwendet werden um standard Eager-Loading zu definieren
 */
trait OptimizedQueries
{
    /**
     * Scope für automatisches Eager-Loading häufig verwendeter Relations
     */
    public function scopeOptimized(Builder $query)
    {
        return $query->with($this->getDefaultWith());
    }

    /**
     * Returns array von Relations die standardmäßig eager-loaded werden
     */
    public function getDefaultWith(): array
    {
        return [];
    }
}
