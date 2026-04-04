<?php

namespace App\Filament\Resources\Subscriptions\Schemas;

use Filament\Schemas\Schema;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;

class SubscriptionInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('tenant.company_name')
                    ->label('Tenant'),
                TextEntry::make('plan')
                    ->badge(),
                TextEntry::make('status')
                    ->badge(),
                TextEntry::make('billing_cycle'),
                TextEntry::make('price_gross_cents')
                    ->money('EUR', divideBy: 100),
                IconEntry::make('is_trial')
                    ->boolean(),
                TextEntry::make('expires_at')
                    ->dateTime(),
            ]);
    }
}
