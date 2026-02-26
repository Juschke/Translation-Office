<?php

namespace App\Filament\Resources\Tenants\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TenantsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('company_name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('legal_form')
                    ->searchable(),
                TextColumn::make('address_street')
                    ->searchable(),
                TextColumn::make('address_house_no')
                    ->searchable(),
                TextColumn::make('address_zip')
                    ->searchable(),
                TextColumn::make('address_city')
                    ->searchable(),
                TextColumn::make('address_country')
                    ->searchable(),
                TextColumn::make('tax_number')
                    ->searchable(),
                TextColumn::make('vat_id')
                    ->searchable(),
                TextColumn::make('tax_office')
                    ->searchable(),
                TextColumn::make('bank_name')
                    ->searchable(),
                TextColumn::make('bank_iban')
                    ->searchable(),
                TextColumn::make('bank_bic')
                    ->searchable(),
                TextColumn::make('bank_code')
                    ->searchable(),
                TextColumn::make('bank_account_holder')
                    ->searchable(),
                TextColumn::make('domain')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge(),
                IconColumn::make('is_active')
                    ->boolean(),
                TextColumn::make('subscription_plan')
                    ->searchable(),
                TextColumn::make('license_key')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('phone')
                    ->searchable(),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('opening_hours')
                    ->searchable(),
            ])
            ->filters([
                //
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
