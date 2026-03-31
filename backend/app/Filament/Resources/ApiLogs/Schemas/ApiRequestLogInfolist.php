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
                TextEntry::make('endpoint'),
                TextEntry::make('status_code')
                    ->badge(),
                TextEntry::make('duration_ms')
                    ->suffix(' ms'),
                TextEntry::make('tenant.company_name')
                    ->label('Mandant')
                    ->placeholder('-'),
                TextEntry::make('user_email'),
                TextEntry::make('ip_address'),
                TextEntry::make('request_id')
                    ->placeholder('-'),
                TextEntry::make('error_message')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('request_body')
                    ->formatStateUsing(fn ($state) => is_array($state)
                        ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                        : ($state ?: '-'))
                    ->prose()
                    ->columnSpanFull(),
                TextEntry::make('response_headers')
                    ->formatStateUsing(fn ($state) => is_array($state)
                        ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                        : ($state ?: '-'))
                    ->prose()
                    ->columnSpanFull(),
                TextEntry::make('response_body')
                    ->formatStateUsing(fn ($state) => is_array($state)
                        ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                        : ($state ?: '-'))
                    ->prose()
                    ->columnSpanFull(),
            ]);
    }
}
