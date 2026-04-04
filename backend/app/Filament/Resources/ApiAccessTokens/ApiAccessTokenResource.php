<?php

namespace App\Filament\Resources\ApiAccessTokens;

use App\Filament\Resources\ApiAccessTokens\Pages\ListApiAccessTokens;
use App\Filament\Resources\ApiAccessTokens\Pages\ViewApiAccessToken;
use App\Models\ApiAccessToken;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ApiAccessTokenResource extends Resource
{
    protected static ?string $model = ApiAccessToken::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-key';

    protected static ?string $navigationLabel = 'API-Zugänge';

    protected static ?string $modelLabel = 'API-Zugang';

    protected static ?string $pluralModelLabel = 'API-Zugänge';

    protected static ?int $navigationSort = 5;

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
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Token')
                    ->searchable(),
                Tables\Columns\TextColumn::make('tokenable.name')
                    ->label('Benutzer')
                    ->searchable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('tokenable.email')
                    ->label('E-Mail')
                    ->searchable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('tenant_name')
                    ->label('Mandant')
                    ->state(fn ($record) => $record->tenant_name ?: '-')
                    ->searchable(query: function (Builder $query, string $search): Builder {
                        return $query->whereHasMorph(
                            'tokenable',
                            ['App\Models\User'],
                            fn (Builder $userQuery) => $userQuery->whereHas(
                                'tenant',
                                fn (Builder $tenantQuery) => $tenantQuery->where('company_name', 'like', "%{$search}%")
                            )
                        );
                    }),
                Tables\Columns\TextColumn::make('abilities_label')
                    ->label('Rechte')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('token_status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'active' => 'success',
                        'expired' => 'danger',
                        default => 'warning',
                    }),
                Tables\Columns\TextColumn::make('last_used_at')
                    ->label('Zuletzt genutzt')
                    ->since()
                    ->sortable()
                    ->placeholder('Nie'),
                Tables\Columns\TextColumn::make('expires_at')
                    ->label('Läuft ab')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Erstellt')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\Filter::make('active_recently')
                    ->label('Aktiv letzte 7 Tage')
                    ->query(fn (Builder $query) => $query->where('last_used_at', '>=', now()->subDays(7))),
                Tables\Filters\Filter::make('expired')
                    ->label('Abgelaufen')
                    ->query(fn (Builder $query) => $query->whereNotNull('expires_at')->where('expires_at', '<', now())),
            ])
            ->recordActions([
                ViewAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name')
                    ->label('Token'),
                TextEntry::make('tokenable.name')
                    ->label('Benutzer')
                    ->placeholder('-'),
                TextEntry::make('tokenable.email')
                    ->label('E-Mail')
                    ->placeholder('-'),
                TextEntry::make('tenant_name')
                    ->label('Mandant')
                    ->state(fn ($record) => $record->tenant_name ?: '-'),
                TextEntry::make('abilities_label')
                    ->label('Rechte'),
                TextEntry::make('token_status')
                    ->label('Status')
                    ->badge(),
                TextEntry::make('last_used_at')
                    ->dateTime()
                    ->placeholder('Nie'),
                TextEntry::make('expires_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->dateTime(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListApiAccessTokens::route('/'),
            'view' => ViewApiAccessToken::route('/{record}'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with('tokenable');
    }

    public static function getNavigationBadge(): ?string
    {
        $count = static::getModel()::query()
            ->where('last_used_at', '>=', now()->subDay())
            ->count();

        return $count > 0 ? (string) $count : null;
    }
}
