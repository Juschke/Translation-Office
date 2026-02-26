<?php

namespace App\Filament\Resources\ApiLogs\Pages;

use App\Filament\Resources\ApiLogs\ApiRequestLogResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewApiRequestLog extends ViewRecord
{
    protected static string $resource = ApiRequestLogResource::class;
}
