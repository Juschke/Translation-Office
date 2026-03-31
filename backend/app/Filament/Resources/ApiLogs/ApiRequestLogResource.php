<?php

namespace App\Filament\Resources\ApiLogs;

use App\Filament\Resources\ApiLogs\Pages\ListApiRequestLogs;
use App\Filament\Resources\ApiLogs\Pages\ViewApiRequestLog;
use App\Filament\Resources\ApiLogs\Schemas\ApiRequestLogInfolist;
use App\Filament\Resources\ApiLogs\Tables\ApiRequestLogsTable;
use App\Models\ApiRequestLog;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use BackedEnum;
use Illuminate\Database\Eloquent\Builder;

class ApiRequestLogResource extends Resource
{
    protected static ?string $model = ApiRequestLog::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-document-magnifying-glass';

    protected static ?string $navigationLabel = 'API Protokolle';

    protected static ?string $modelLabel = 'API Protokoll';

    protected static ?string $pluralModelLabel = 'API Protokolle';

    protected static ?int $navigationSort = 4;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema;
    }

    public static function infolist(Schema $schema): Schema
    {
        return ApiRequestLogInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ApiRequestLogsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListApiRequestLogs::route('/'),
            'view' => ViewApiRequestLog::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['user:id,name,email', 'tenant:id,company_name']);
    }

    public static function getNavigationBadge(): ?string
    {
        $count = static::getModel()::where('status_code', '>=', 500)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }
}
