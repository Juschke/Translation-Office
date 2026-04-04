<?php

namespace App\Filament\Resources\ApiAccessTokens\Pages;

use App\Filament\Resources\ApiAccessTokens\ApiAccessTokenResource;
use Filament\Resources\Pages\ListRecords;

class ListApiAccessTokens extends ListRecords
{
    protected static string $resource = ApiAccessTokenResource::class;
}
