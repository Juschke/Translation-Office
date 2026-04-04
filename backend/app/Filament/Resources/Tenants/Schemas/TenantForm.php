<?php

namespace App\Filament\Resources\Tenants\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class TenantForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->default(null),
                TextInput::make('company_name')
                    ->default(null),
                TextInput::make('legal_form')
                    ->default(null),
                TextInput::make('address_street')
                    ->default(null),
                TextInput::make('address_house_no')
                    ->default(null),
                TextInput::make('address_zip')
                    ->default(null),
                TextInput::make('address_city')
                    ->default(null),
                TextInput::make('address_country')
                    ->required()
                    ->default('DE'),
                TextInput::make('tax_number')
                    ->default(null),
                TextInput::make('vat_id')
                    ->default(null),
                TextInput::make('tax_office')
                    ->default(null),
                TextInput::make('bank_name')
                    ->default(null),
                TextInput::make('bank_iban')
                    ->default(null),
                TextInput::make('bank_bic')
                    ->default(null),
                TextInput::make('bank_code')
                    ->default(null),
                TextInput::make('bank_account_holder')
                    ->default(null),
                TextInput::make('domain')
                    ->default(null),
                Select::make('status')
                    ->options(['active' => 'Active', 'inactive' => 'Inactive'])
                    ->default('active')
                    ->required(),
                Toggle::make('is_active')
                    ->required(),
                Textarea::make('settings')
                    ->default(null)
                    ->columnSpanFull(),
                TextInput::make('subscription_plan')
                    ->required()
                    ->default('basic'),
                TextInput::make('license_key')
                    ->default(null),
                TextInput::make('phone')
                    ->tel()
                    ->default(null),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->default(null),
                TextInput::make('opening_hours')
                    ->default(null),
            ]);
    }
}
