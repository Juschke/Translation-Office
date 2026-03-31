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
                TextColumn::make('address_city')
                    ->searchable(),
                TextColumn::make('domain')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge(),
                IconColumn::make('is_active')
                    ->boolean(),
                TextColumn::make('subscription.plan')
                    ->label('Abo')
                    ->badge()
                    ->placeholder('-'),
                TextColumn::make('subscription.status')
                    ->label('Abo-Status')
                    ->badge()
                    ->placeholder('-'),
                TextColumn::make('users_count')
                    ->label('Benutzer')
                    ->sortable(),
                TextColumn::make('projects_count')
                    ->label('Projekte')
                    ->sortable(),
                TextColumn::make('tenant_invoices_count')
                    ->label('Rechnungen')
                    ->sortable(),
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
                TextColumn::make('website')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                \Filament\Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active' => 'Active',
                        'inactive' => 'Inactive',
                    ]),
                \Filament\Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Aktiv'),
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
