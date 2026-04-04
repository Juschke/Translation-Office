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
                TextEntry::make('price_net_cents')
                    ->money('EUR', divideBy: 100),
                TextEntry::make('price_gross_cents')
                    ->money('EUR', divideBy: 100),
                TextEntry::make('vat_rate_percent')
                    ->suffix('%'),
                IconEntry::make('is_trial')
                    ->boolean(),
                TextEntry::make('current_period_start')
                    ->dateTime(),
                TextEntry::make('current_period_end')
                    ->dateTime(),
                TextEntry::make('payment_provider')
                    ->placeholder('-'),
                TextEntry::make('billing_email')
                    ->placeholder('-'),
                TextEntry::make('expires_at')
                    ->dateTime(),
                TextEntry::make('notes')
                    ->placeholder('-')
                    ->columnSpanFull(),
            ]);
    }
}
