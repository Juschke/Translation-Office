<?php

namespace App\Filament\Resources\Subscriptions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SubscriptionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tenant.company_name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('plan')
                    ->badge(),
                TextColumn::make('status')
                    ->badge(),
                TextColumn::make('billing_cycle'),
                TextColumn::make('price_net_cents')
                    ->money('EUR', divideBy: 100)
                    ->label('Netto')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('price_gross_cents')
                    ->money('EUR', divideBy: 100)
                    ->label('Brutto')
                    ->sortable(),
                TextColumn::make('payment_provider')
                    ->label('Zahlart')
                    ->badge()
                    ->placeholder('-'),
                IconColumn::make('is_trial')
                    ->boolean(),
                TextColumn::make('expires_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('plan')
                    ->options([
                        'free' => 'Free',
                        'starter' => 'Starter',
                        'professional' => 'Professional',
                        'enterprise' => 'Enterprise',
                    ]),
                SelectFilter::make('status')
                    ->options([
                        'active' => 'Active',
                        'trial' => 'Trial',
                        'cancelled' => 'Cancelled',
                        'expired' => 'Expired',
                        'past_due' => 'Past Due',
                    ]),
                TernaryFilter::make('auto_renew')
                    ->label('Auto Renew'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
