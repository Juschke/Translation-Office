<?php

namespace App\Filament\Resources;

use BackedEnum, UnitEnum;
use App\Models\Payment;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-credit-card';

    protected static UnitEnum|string|null $navigationGroup = 'B2B Features';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Payment Information')
                    ->schema([
                        Forms\Components\Select::make('invoice_id')
                            ->relationship('invoice', 'invoice_number')
                            ->required()
                            ->disabled(fn (string $operation) => $operation === 'edit')
                            ->searchable(),

                        Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->prefix('€')
                            ->required()
                            ->disabled(),

                        Forms\Components\Select::make('currency')
                            ->options([
                                'EUR' => 'Euro (EUR)',
                                'USD' => 'US Dollar (USD)',
                                'GBP' => 'British Pound (GBP)',
                                'CHF' => 'Swiss Franc (CHF)',
                            ])
                            ->required()
                            ->disabled(),

                        Forms\Components\Select::make('payment_method')
                            ->options([
                                'stripe' => 'Stripe Card Payment',
                                'bank_transfer' => 'Bank Transfer',
                                'cash' => 'Cash',
                                'check' => 'Check',
                            ])
                            ->required(),

                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'completed' => 'Completed',
                                'failed' => 'Failed',
                                'refunded' => 'Refunded',
                            ])
                            ->required(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Stripe Details')
                    ->schema([
                        Forms\Components\TextInput::make('stripe_intent_id')
                            ->label('Payment Intent ID')
                            ->disabled()
                            ->copyable(),

                        Forms\Components\TextInput::make('stripe_charge_id')
                            ->label('Charge ID')
                            ->disabled()
                            ->copyable(),
                    ])
                    ->columns(2)
                    ->visible(fn (Payment $record) => $record->stripe_intent_id),

                Forms\Components\Section::make('Refund Information')
                    ->schema([
                        Forms\Components\TextInput::make('refunded_amount')
                            ->numeric()
                            ->prefix('€')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('refunded_at')
                            ->disabled(),
                    ])
                    ->columns(2)
                    ->visible(fn (Payment $record) => $record->status === 'refunded'),

                Forms\Components\Section::make('Timestamps')
                    ->schema([
                        Forms\Components\DateTimePickerField::make('paid_at')
                            ->label('Payment Date')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('created_at')
                            ->disabled(),

                        Forms\Components\DateTimePickerField::make('updated_at')
                            ->disabled(),
                    ])
                    ->columns(3),
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

                Tables\Columns\TextColumn::make('amount')
                    ->money('EUR')
                    ->sortable(),

                Tables\Columns\TextColumn::make('currency')
                    ->badge(),

                Tables\Columns\TextColumn::make('payment_method')
                    ->badge()
                    ->formatStateUsing(fn ($state) => ucfirst(str_replace('_', ' ', $state))),

                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'completed',
                        'danger' => 'failed',
                        'gray' => 'refunded',
                    ]),

                Tables\Columns\TextColumn::make('paid_at')
                    ->dateTime()
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                        'refunded' => 'Refunded',
                    ]),

                Tables\Filters\SelectFilter::make('payment_method')
                    ->options([
                        'stripe' => 'Stripe',
                        'bank_transfer' => 'Bank Transfer',
                        'cash' => 'Cash',
                        'check' => 'Check',
                    ]),

                Tables\Filters\SelectFilter::make('currency')
                    ->options([
                        'EUR' => 'EUR',
                        'USD' => 'USD',
                        'GBP' => 'GBP',
                        'CHF' => 'CHF',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('refund')
                    ->label('Refund')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->visible(fn (Payment $record) => $record->status === 'completed')
                    ->form([
                        Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->placeholder('Leave empty for full refund'),
                    ])
                    ->action(function (Payment $record, array $data) {
                        $paymentService = app(\App\Services\PaymentService::class);
                        $paymentService->refund($record, $data['amount'] ?? null);

                        \Filament\Notifications\Notification::make()
                            ->success()
                            ->title('Payment Refunded')
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
                        ->visible(fn () => false), // Payments cannot be deleted
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\PaymentResource\Pages\ListPayments::route('/'),
            'view' => \App\Filament\Resources\PaymentResource\Pages\ViewPayment::route('/{record}'),
            'edit' => \App\Filament\Resources\PaymentResource\Pages\EditPayment::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->with(['invoice', 'tenant'])
            ->where('tenant_id', auth()->user()->tenant_id);
    }
}
