<?php

namespace App\Filament\Resources;

use App\Models\ApiKey;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use BackedEnum;
use UnitEnum;

class ApiKeyResource extends Resource
{
    protected static ?string $model = ApiKey::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-key';

    protected static string|UnitEnum|null $navigationGroup = 'B2B Features';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Key Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\TextInput::make('key')
                            ->label('API Key')
                            ->disabled()
                            ->copyable()
                            ->visible(fn (string $operation) => $operation === 'view'),

                        Forms\Components\MultiSelectCheckboxes::make('scopes')
                            ->label('Permissions')
                            ->options([
                                'invoices:read' => 'Read Invoices',
                                'invoices:write' => 'Create/Edit Invoices',
                                'projects:read' => 'Read Projects',
                                'projects:write' => 'Create/Edit Projects',
                                'customers:read' => 'Read Customers',
                                'customers:write' => 'Create/Edit Customers',
                                'payments:read' => 'View Payments',
                                'reports:read' => 'View Reports',
                            ])
                            ->required(),

                        Forms\Components\TextInput::make('rate_limit')
                            ->numeric()
                            ->default(1000)
                            ->helperText('Requests per minute')
                            ->required(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Security')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),

                        Forms\Components\DateTimePicker::make('expires_at')
                            ->label('Expiration Date (optional)'),

                        Forms\Components\TagsInput::make('ip_whitelist')
                            ->label('IP Whitelist (optional)')
                            ->helperText('Leave empty to allow all IPs'),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Usage Statistics')
                    ->schema([
                        Forms\Components\DateTimePickerField::make('last_used_at')
                            ->disabled()
                            ->visible(fn (ApiKey $record) => $record?->last_used_at),

                        Forms\Components\Placeholder::make('never_used')
                            ->content('Never used')
                            ->visible(fn (ApiKey $record) => !$record?->last_used_at),
                    ])
                    ->visible(fn (string $operation) => $operation === 'view'),

                Forms\Components\Section::make('Timestamps')
                    ->schema([
                        Forms\Components\DateTimePickerField::make('created_at')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('updated_at')
                            ->disabled(),
                    ])
                    ->columns(2)
                    ->visible(fn (string $operation) => $operation === 'view'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('name')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('key')
                    ->formatStateUsing(fn ($state) => substr($state, 0, 8) . '...')
                    ->copyable(fn ($state) => $state)
                    ->label('Key'),

                Tables\Columns\TextColumn::make('rate_limit')
                    ->label('Rate Limit')
                    ->formatStateUsing(fn ($state) => "$state/min"),

                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('last_used_at')
                    ->dateTime()
                    ->label('Last Used'),

                Tables\Columns\TextColumn::make('expires_at')
                    ->dateTime()
                    ->badge()
                    ->color('danger')
                    ->visible(fn (ApiKey $record) => $record->expires_at),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Status'),

                Tables\Filters\Filter::make('expires_at')
                    ->form([
                        Forms\Components\DatePicker::make('expires_from')
                            ->label('Expires From'),
                        Forms\Components\DatePicker::make('expires_until')
                            ->label('Expires Until'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when($data['expires_from'], fn ($q) => $q->whereDate('expires_at', '>=', $data['expires_from']))
                            ->when($data['expires_until'], fn ($q) => $q->whereDate('expires_at', '<=', $data['expires_until']));
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('regenerate')
                    ->label('Regenerate Secret')
                    ->icon('heroicon-o-arrow-path')
                    ->requiresConfirmation()
                    ->action(function (ApiKey $record) {
                        $record->update([
                            'secret' => hash('sha256', \Illuminate\Support\Str::random(64)),
                        ]);

                        \Filament\Notifications\Notification::make()
                            ->success()
                            ->title('Secret Regenerated')
                            ->send();
                    }),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\ApiKeyResource\Pages\ListApiKeys::route('/'),
            'create' => \App\Filament\Resources\ApiKeyResource\Pages\CreateApiKey::route('/create'),
            'view' => \App\Filament\Resources\ApiKeyResource\Pages\ViewApiKey::route('/{record}'),
            'edit' => \App\Filament\Resources\ApiKeyResource\Pages\EditApiKey::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->orderByDesc('created_at');
    }
}
