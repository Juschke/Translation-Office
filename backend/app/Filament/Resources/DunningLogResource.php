<?php

namespace App\Filament\Resources;

use BackedEnum, UnitEnum;
use App\Models\DunningLog;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class DunningLogResource extends Resource
{
    protected static ?string $model = DunningLog::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-envelope';

    protected static UnitEnum|string|null $navigationGroup = 'B2B Features';

    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Dunning Information')
                    ->schema([
                        Forms\Components\Select::make('invoice_id')
                            ->relationship('invoice', 'invoice_number')
                            ->disabled(),

                        Forms\Components\TextInput::make('outstanding_amount')
                            ->numeric()
                            ->prefix('€')
                            ->disabled(),

                        Forms\Components\Select::make('reminder_level')
                            ->options([
                                1 => 'Level 1 - First Reminder',
                                2 => 'Level 2 - Second Reminder',
                                3 => 'Level 3 - Final Notice',
                            ])
                            ->disabled(),

                        Forms\Components\Select::make('status')
                            ->options([
                                'sent' => 'Sent',
                                'opened' => 'Opened',
                                'acknowledged' => 'Acknowledged',
                                'failed' => 'Failed',
                            ])
                            ->disabled(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('PDF & Documents')
                    ->schema([
                        Forms\Components\TextInput::make('pdf_path')
                            ->label('PDF Path')
                            ->disabled()
                            ->copyable()
                            ->visible(fn (DunningLog $record) => $record?->pdf_path),

                        Forms\Components\TextInput::make('pdf_hash')
                            ->label('PDF Hash (SHA256)')
                            ->disabled()
                            ->copyable()
                            ->visible(fn (DunningLog $record) => $record?->pdf_hash),
                    ]),

                Forms\Components\Section::make('Notes')
                    ->schema([
                        Forms\Components\Textarea::make('notes')
                            ->maxLength(1000),
                    ]),

                Forms\Components\Section::make('Timestamps')
                    ->schema([
                        Forms\Components\DateTimePickerField::make('sent_at')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('created_at')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('updated_at')
                            ->disabled(),
                    ])
                    ->columns(3)
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

                Tables\Columns\TextColumn::make('invoice.invoice_number')
                    ->label('Invoice')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('reminder_level')
                    ->label('Level')
                    ->colors([
                        'info' => 1,
                        'warning' => 2,
                        'danger' => 3,
                    ])
                    ->formatStateUsing(fn ($state) => "Level $state"),

                Tables\Columns\TextColumn::make('outstanding_amount')
                    ->money('EUR')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'success' => 'sent',
                        'info' => 'opened',
                        'success' => 'acknowledged',
                        'danger' => 'failed',
                    ]),

                Tables\Columns\TextColumn::make('sent_at')
                    ->dateTime()
                    ->sortable(),

                Tables\Columns\IconColumn::make('pdf_path')
                    ->boolean()
                    ->label('Has PDF')
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('reminder_level')
                    ->options([
                        1 => 'Level 1',
                        2 => 'Level 2',
                        3 => 'Level 3',
                    ]),

                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'sent' => 'Sent',
                        'opened' => 'Opened',
                        'acknowledged' => 'Acknowledged',
                        'failed' => 'Failed',
                    ]),

                Tables\Filters\Filter::make('sent_at')
                    ->form([
                        Forms\Components\DatePicker::make('sent_from')
                            ->label('Sent From'),
                        Forms\Components\DatePicker::make('sent_until')
                            ->label('Sent Until'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when($data['sent_from'], fn ($q) => $q->whereDate('sent_at', '>=', $data['sent_from']))
                            ->when($data['sent_until'], fn ($q) => $q->whereDate('sent_at', '<=', $data['sent_until']));
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('download_pdf')
                    ->label('Download PDF')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->url(fn (DunningLog $record) => $record->pdf_path ? route('filament.admin.resources.dunning-logs.download', $record) : null)
                    ->visible(fn (DunningLog $record) => $record->pdf_path),
                Tables\Actions\Action::make('resend')
                    ->label('Resend Reminder')
                    ->icon('heroicon-o-arrow-path')
                    ->requiresConfirmation()
                    ->visible(fn (DunningLog $record) => $record->status === 'failed')
                    ->action(function (DunningLog $record) {
                        $dunningService = app(\App\Services\DunningService::class);
                        $dunningService->sendReminder($record->invoice, $record->reminder_level);

                        \Filament\Notifications\Notification::make()
                            ->success()
                            ->title('Reminder Resent')
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
                        ->visible(fn () => false), // Logs cannot be deleted (GoBD)
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\DunningLogResource\Pages\ListDunningLogs::route('/'),
            'view' => \App\Filament\Resources\DunningLogResource\Pages\ViewDunningLog::route('/{record}'),
            'edit' => \App\Filament\Resources\DunningLogResource\Pages\EditDunningLog::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['invoice'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->orderByDesc('sent_at');
    }
}
