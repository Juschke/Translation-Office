<?php

namespace App\Filament\Resources\TenantInvoices;

use App\Filament\Resources\TenantInvoices\Pages\CreateTenantInvoice;
use App\Filament\Resources\TenantInvoices\Pages\EditTenantInvoice;
use App\Filament\Resources\TenantInvoices\Pages\ListTenantInvoices;
use App\Filament\Resources\TenantInvoices\Pages\ViewTenantInvoice;
use App\Models\Subscription;
use App\Models\TenantInvoice;
use App\Scopes\TenantScope;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class TenantInvoiceResource extends Resource
{
    protected static ?string $model = TenantInvoice::class;

    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-document-currency-euro';

    protected static ?string $navigationLabel = 'Plattform-Rechnungen';

    protected static ?string $modelLabel = 'Plattform-Rechnung';

    protected static ?string $pluralModelLabel = 'Plattform-Rechnungen';

    protected static ?int $navigationSort = 4;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Rechnungsdaten')
                    ->schema([
                        Forms\Components\Select::make('tenant_id')
                            ->relationship('tenant', 'company_name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Forms\Components\Select::make('subscription_id')
                            ->relationship('subscription', 'id')
                            ->getOptionLabelFromRecordUsing(fn (Subscription $record) => sprintf(
                                '%s | %s | %s',
                                $record->tenant?->company_name ?? 'Mandant',
                                strtoupper($record->plan),
                                strtoupper($record->status)
                            ))
                            ->searchable()
                            ->preload(),
                        Forms\Components\TextInput::make('invoice_number')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Select::make('status')
                            ->options([
                                'draft' => 'Draft',
                                'open' => 'Open',
                                'pending' => 'Pending',
                                'paid' => 'Paid',
                                'failed' => 'Failed',
                                'cancelled' => 'Cancelled',
                                'refunded' => 'Refunded',
                            ])
                            ->required()
                            ->default('open'),
                        Forms\Components\DatePicker::make('invoice_date')
                            ->required(),
                        Forms\Components\DatePicker::make('due_date'),
                        Forms\Components\DatePicker::make('billing_period_start'),
                        Forms\Components\DatePicker::make('billing_period_end'),
                    ])
                    ->columns(2),
                Section::make('Beträge')
                    ->schema([
                        Forms\Components\TextInput::make('amount_net')
                            ->numeric()
                            ->prefix('EUR')
                            ->required()
                            ->default(0),
                        Forms\Components\TextInput::make('tax_amount')
                            ->numeric()
                            ->prefix('EUR')
                            ->required()
                            ->default(0),
                        Forms\Components\TextInput::make('amount')
                            ->label('Bruttobetrag')
                            ->numeric()
                            ->prefix('EUR')
                            ->required()
                            ->default(0),
                        Forms\Components\TextInput::make('currency')
                            ->default('EUR')
                            ->required(),
                        Forms\Components\DateTimePicker::make('paid_at'),
                        Forms\Components\Select::make('payment_provider')
                            ->options([
                                'invoice' => 'Invoice',
                                'stripe' => 'Stripe',
                                'paypal' => 'PayPal',
                                'sepa' => 'SEPA',
                            ]),
                        Forms\Components\TextInput::make('external_invoice_id'),
                        Forms\Components\TextInput::make('pdf_url')
                            ->url(),
                        Forms\Components\Textarea::make('notes')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('invoice_number'),
                TextEntry::make('tenant.company_name')
                    ->label('Mandant'),
                TextEntry::make('subscription.plan')
                    ->label('Abo')
                    ->badge()
                    ->placeholder('-'),
                TextEntry::make('status')
                    ->badge(),
                TextEntry::make('invoice_date')
                    ->date(),
                TextEntry::make('due_date')
                    ->date()
                    ->placeholder('-'),
                TextEntry::make('paid_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('amount_net')
                    ->money('EUR'),
                TextEntry::make('tax_amount')
                    ->money('EUR'),
                TextEntry::make('amount')
                    ->label('Bruttobetrag')
                    ->money('EUR'),
                TextEntry::make('payment_provider')
                    ->placeholder('-'),
                TextEntry::make('external_invoice_id')
                    ->placeholder('-'),
                TextEntry::make('billing_period_start')
                    ->date()
                    ->placeholder('-'),
                TextEntry::make('billing_period_end')
                    ->date()
                    ->placeholder('-'),
                TextEntry::make('pdf_url')
                    ->url(fn ($state) => $state)
                    ->placeholder('-'),
                TextEntry::make('notes')
                    ->placeholder('-')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('invoice_number')
                    ->label('Rechnung')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('tenant.company_name')
                    ->label('Mandant')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('subscription.plan')
                    ->label('Abo')
                    ->badge()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('amount')
                    ->label('Brutto')
                    ->money('EUR')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'paid' => 'success',
                        'failed', 'cancelled' => 'danger',
                        'refunded' => 'warning',
                        default => 'info',
                    }),
                Tables\Columns\TextColumn::make('invoice_date')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('due_date')
                    ->date()
                    ->sortable()
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('paid_at')
                    ->since()
                    ->label('Bezahlt')
                    ->placeholder('Offen'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'open' => 'Open',
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                        'cancelled' => 'Cancelled',
                        'refunded' => 'Refunded',
                    ]),
                Tables\Filters\SelectFilter::make('tenant_id')
                    ->relationship('tenant', 'company_name')
                    ->searchable()
                    ->preload(),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('invoice_date', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTenantInvoices::route('/'),
            'create' => CreateTenantInvoice::route('/create'),
            'view' => ViewTenantInvoice::route('/{record}'),
            'edit' => EditTenantInvoice::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScope(TenantScope::class)
            ->with(['tenant', 'subscription.tenant']);
    }

    public static function getNavigationBadge(): ?string
    {
        $count = static::getModel()::query()
            ->whereIn('status', ['open', 'pending', 'failed'])
            ->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
