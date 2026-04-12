<?php

namespace App\Filament\Resources;

use BackedEnum, UnitEnum;
use App\Models\Webhook;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class WebhookResource extends Resource
{
    protected static ?string $model = Webhook::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-arrow-path';

    protected static UnitEnum|string|null $navigationGroup = 'B2B Features';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Webhook Configuration')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\TextInput::make('url')
                            ->url()
                            ->required()
                            ->helperText('https://api.example.com/webhooks/payments'),

                        Forms\Components\MultiSelectCheckboxes::make('events')
                            ->label('Events to Subscribe')
                            ->options([
                                'invoice.created' => 'Invoice Created',
                                'invoice.issued' => 'Invoice Issued',
                                'payment.completed' => 'Payment Completed',
                                'payment.failed' => 'Payment Failed',
                                'project.updated' => 'Project Updated',
                                'project.completed' => 'Project Completed',
                                'customer.created' => 'Customer Created',
                                'customer.updated' => 'Customer Updated',
                            ])
                            ->required(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Security & Headers')
                    ->schema([
                        Forms\Components\TextInput::make('token')
                            ->label('Authentication Token')
                            ->password()
                            ->disabled()
                            ->copyable()
                            ->helperText('Token to verify webhook origin')
                            ->visible(fn (string $operation) => $operation === 'view'),

                        Forms\Components\KeyValue::make('headers')
                            ->label('Custom HTTP Headers')
                            ->helperText('Optional: Send additional headers with webhook'),
                    ]),

                Forms\Components\Section::make('Status & Logs')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),

                        Forms\Components\DateTimePickerField::make('last_triggered_at')
                            ->disabled()
                            ->visible(fn (Webhook $record) => $record?->last_triggered_at),

                        Forms\Components\Placeholder::make('never_triggered')
                            ->content('Never triggered')
                            ->visible(fn (Webhook $record) => !$record?->last_triggered_at),
                    ]),

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

                Tables\Columns\TextColumn::make('url')
                    ->limit(50)
                    ->copyable(),

                Tables\Columns\TextColumn::make('events')
                    ->label('Events')
                    ->badge()
                    ->formatStateUsing(fn ($state) => count($state ?? []) . ' events')
                    ->separator(','),

                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('last_triggered_at')
                    ->dateTime()
                    ->label('Last Triggered'),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Status'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('test')
                    ->label('Send Test Webhook')
                    ->icon('heroicon-o-paper-airplane')
                    ->action(function (Webhook $record) {
                        $testData = [
                            'event' => 'test.webhook',
                            'timestamp' => now()->toIso8601String(),
                            'data' => [
                                'webhook_id' => $record->id,
                                'test' => true,
                                'message' => 'This is a test webhook',
                            ],
                        ];

                        \App\Jobs\TriggerWebhook::dispatchSync($record, 'test.webhook', $testData);

                        \Filament\Notifications\Notification::make()
                            ->success()
                            ->title('Test Webhook Sent')
                            ->body('Check your webhook endpoint for the test payload')
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
            'index' => \App\Filament\Resources\WebhookResource\Pages\ListWebhooks::route('/'),
            'create' => \App\Filament\Resources\WebhookResource\Pages\CreateWebhook::route('/create'),
            'view' => \App\Filament\Resources\WebhookResource\Pages\ViewWebhook::route('/{record}'),
            'edit' => \App\Filament\Resources\WebhookResource\Pages\EditWebhook::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->orderByDesc('created_at');
    }
}
