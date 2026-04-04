<?php

namespace App\Filament\Resources\ApiLogs\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ApiRequestLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('method')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'GET' => 'info',
                        'POST' => 'success',
                        'PUT', 'PATCH' => 'warning',
                        'DELETE' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('url')
                    ->limit(50)
                    ->searchable(),
                TextColumn::make('endpoint')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status_code')
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 500 => 'danger',
                        $state >= 400 => 'warning',
                        $state >= 300 => 'info',
                        $state >= 200 => 'success',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('duration_ms')
                    ->label('Duration')
                    ->suffix('ms')
                    ->color(fn ($state) => $state > 1000 ? 'danger' : ($state > 500 ? 'warning' : null))
                    ->sortable(),
                TextColumn::make('tenant.company_name')
                    ->label('Mandant')
                    ->placeholder('-')
                    ->searchable(),
                TextColumn::make('user_email')
                    ->searchable(),
                IconColumn::make('is_slow')
                    ->label('Langsam')
                    ->boolean()
                    ->state(fn ($record) => $record->isSlow()),
            ])
            ->filters([
                SelectFilter::make('method')
                    ->options([
                        'GET' => 'GET',
                        'POST' => 'POST',
                        'PUT' => 'PUT',
                        'PATCH' => 'PATCH',
                        'DELETE' => 'DELETE',
                    ]),
                SelectFilter::make('status_code')
                    ->options([
                        200 => '200',
                        201 => '201',
                        204 => '204',
                        400 => '400',
                        401 => '401',
                        403 => '403',
                        404 => '404',
                        422 => '422',
                        500 => '500',
                    ]),
                Filter::make('errors_only')
                    ->label('Nur Fehler')
                    ->query(fn (Builder $query) => $query->where('status_code', '>=', 400)),
                Filter::make('slow_only')
                    ->label('Nur langsam')
                    ->query(fn (Builder $query) => $query->where('duration_ms', '>', 1000)),
            ])
            ->recordActions([
                ViewAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
