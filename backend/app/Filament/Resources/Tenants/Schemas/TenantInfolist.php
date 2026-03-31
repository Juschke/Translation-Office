<?php

namespace App\Filament\Resources\Tenants\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class TenantInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name')
                    ->placeholder('-'),
                TextEntry::make('company_name')
                    ->placeholder('-'),
                TextEntry::make('legal_form')
                    ->placeholder('-'),
                TextEntry::make('managing_director')
                    ->placeholder('-'),
                TextEntry::make('address_street')
                    ->placeholder('-'),
                TextEntry::make('address_house_no')
                    ->placeholder('-'),
                TextEntry::make('address_zip')
                    ->placeholder('-'),
                TextEntry::make('address_city')
                    ->placeholder('-'),
                TextEntry::make('address_country'),
                TextEntry::make('tax_number')
                    ->placeholder('-'),
                TextEntry::make('vat_id')
                    ->placeholder('-'),
                TextEntry::make('tax_office')
                    ->placeholder('-'),
                TextEntry::make('bank_name')
                    ->placeholder('-'),
                TextEntry::make('bank_iban')
                    ->placeholder('-'),
                TextEntry::make('bank_bic')
                    ->placeholder('-'),
                TextEntry::make('bank_code')
                    ->placeholder('-'),
                TextEntry::make('bank_account_holder')
                    ->placeholder('-'),
                TextEntry::make('domain')
                    ->placeholder('-'),
                TextEntry::make('status')
                    ->badge(),
                IconEntry::make('is_active')
                    ->boolean(),
                TextEntry::make('settings')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('subscription_plan'),
                TextEntry::make('subscription.plan')
                    ->label('Aktuelles Abo')
                    ->badge()
                    ->placeholder('-'),
                TextEntry::make('subscription.status')
                    ->label('Abo-Status')
                    ->badge()
                    ->placeholder('-'),
                TextEntry::make('users_count')
                    ->label('Benutzer')
                    ->state(fn ($record) => $record->users_count)
                    ->badge(),
                TextEntry::make('projects_count')
                    ->label('Projekte')
                    ->state(fn ($record) => $record->projects_count)
                    ->badge(),
                TextEntry::make('tenant_invoices_count')
                    ->label('Rechnungen')
                    ->state(fn ($record) => $record->tenant_invoices_count)
                    ->badge(),
                TextEntry::make('license_key')
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('phone')
                    ->placeholder('-'),
                TextEntry::make('email')
                    ->label('Email address')
                    ->placeholder('-'),
                TextEntry::make('website')
                    ->url(fn ($state) => $state)
                    ->placeholder('-'),
                TextEntry::make('opening_hours')
                    ->placeholder('-'),
            ]);
    }
}
