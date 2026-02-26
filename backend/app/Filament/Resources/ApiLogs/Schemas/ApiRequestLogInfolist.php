<?php

namespace App\Filament\Resources\ApiLogs\Schemas;

use Filament\Schemas\Schema;
use Filament\Infolists\Components\TextEntry;

class ApiRequestLogInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('created_at')
                    ->dateTime(),
                TextEntry::make('method')
                    ->badge(),
                TextEntry::make('url'),
                TextEntry::make('status_code')
                    ->badge(),
                TextEntry::make('duration_ms')
                    ->suffix(' ms'),
                TextEntry::make('user_email'),
                TextEntry::make('ip_address'),
                TextEntry::make('request_body')
                    ->prose()
                    ->columnSpanFull(),
                TextEntry::make('response_body')
                    ->prose()
                    ->columnSpanFull(),
            ]);
    }
}
