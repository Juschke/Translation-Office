<?php

namespace App\Filament\Resources\Subscriptions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SubscriptionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('tenant_id')
                    ->relationship('tenant', 'company_name')
                    ->required()
                    ->searchable()
                    ->preload(),
                Select::make('plan')
                    ->options([
                        'free' => 'Free',
                        'starter' => 'Starter',
                        'professional' => 'Professional',
                        'enterprise' => 'Enterprise',
                    ])
                    ->required()
                    ->default('free'),
                Select::make('status')
                    ->options([
                        'active' => 'Active',
                        'trial' => 'Trial',
                        'cancelled' => 'Cancelled',
                        'expired' => 'Expired',
                        'past_due' => 'Past Due',
                    ])
                    ->required()
                    ->default('trial'),
                Select::make('billing_cycle')
                    ->options([
                        'monthly' => 'Monthly',
                        'yearly' => 'Yearly',
                    ])
                    ->required()
                    ->default('monthly'),
                TextInput::make('price_net_cents')
                    ->numeric()
                    ->required()
                    ->default(0),
                TextInput::make('price_gross_cents')
                    ->numeric()
                    ->required()
                    ->default(0),
                TextInput::make('vat_rate_percent')
                    ->numeric()
                    ->required()
                    ->default(19),
                TextInput::make('max_users')
                    ->numeric()
                    ->default(null),
                TextInput::make('max_projects')
                    ->numeric()
                    ->default(null),
                TextInput::make('max_storage_gb')
                    ->numeric()
                    ->default(null),
                Toggle::make('is_trial')
                    ->required(),
                DateTimePicker::make('trial_ends_at'),
                DateTimePicker::make('started_at'),
                DateTimePicker::make('current_period_start'),
                DateTimePicker::make('current_period_end'),
                DateTimePicker::make('cancelled_at'),
                DateTimePicker::make('expires_at'),
                Select::make('payment_provider')
                    ->options([
                        'stripe' => 'Stripe',
                        'paypal' => 'PayPal',
                        'sepa' => 'SEPA',
                        'invoice' => 'Invoice',
                    ])
                    ->default(null),
                TextInput::make('payment_provider_subscription_id')
                    ->default(null),
                TextInput::make('payment_provider_customer_id')
                    ->default(null),
                TextInput::make('billing_email')
                    ->email()
                    ->default(null),
                Textarea::make('billing_address')
                    ->default(null),
                Toggle::make('auto_renew')
                    ->required()
                    ->default(true),
                Textarea::make('notes')
                    ->default(null)
                    ->columnSpanFull(),
            ]);
    }
}
