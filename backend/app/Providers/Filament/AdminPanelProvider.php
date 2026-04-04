<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use App\Filament\Pages\Contact;
use App\Filament\Pages\CustomerSupport;
use App\Filament\Pages\Modules;
use App\Filament\Pages\Packages;
use App\Filament\Pages\Tickets;
use App\Filament\Resources\ActivityLogResource;
use App\Filament\Resources\ApiAccessTokens\ApiAccessTokenResource;
use App\Filament\Resources\ApiLogs\ApiRequestLogResource;
use App\Filament\Resources\InvoiceResource;
use App\Filament\Resources\Subscriptions\SubscriptionResource;
use App\Filament\Resources\TenantInvoices\TenantInvoiceResource;
use App\Filament\Resources\Tenants\TenantResource;
use App\Filament\Resources\UserResource;
use Filament\Navigation\NavigationItem;
use ShuvroRoy\FilamentSpatieLaravelHealth\FilamentSpatieLaravelHealthPlugin;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->colors([
                'primary' => '#1B4D4F',
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->topNavigation()
            ->plugin(
                FilamentSpatieLaravelHealthPlugin::make()
                    ->navigationLabel('Health Check')
                    ->navigationIcon('heroicon-o-cpu-chip')
                    ->navigationSort(5)
            )
            ->navigationItems([
                NavigationItem::make('Dashboard')
                    ->icon('heroicon-o-home')
                    ->url(fn () => Dashboard::getUrl())
                    ->sort(0),
                NavigationItem::make('Mandanten')
                    ->sort(10)
                    ->childItems([
                        NavigationItem::make('Mandanten')
                            ->icon('heroicon-o-building-office-2')
                            ->url(fn () => TenantResource::getUrl()),
                        NavigationItem::make('Benutzer')
                            ->icon('heroicon-o-users')
                            ->url(fn () => UserResource::getUrl()),
                    ]),
                NavigationItem::make('Finanzen')
                    ->sort(20)
                    ->childItems([
                        NavigationItem::make('Rechnungen')
                            ->icon('heroicon-o-document-text')
                            ->url(fn () => InvoiceResource::getUrl())
                            ->badge(fn () => InvoiceResource::getNavigationBadge(), fn () => InvoiceResource::getNavigationBadgeColor()),
                        NavigationItem::make('Plattform-Rechnungen')
                            ->icon('heroicon-o-document-currency-euro')
                            ->url(fn () => TenantInvoiceResource::getUrl())
                            ->badge(fn () => TenantInvoiceResource::getNavigationBadge(), fn () => TenantInvoiceResource::getNavigationBadgeColor()),
                        NavigationItem::make('Abonnements')
                            ->icon('heroicon-o-credit-card')
                            ->url(fn () => SubscriptionResource::getUrl())
                            ->badge(fn () => SubscriptionResource::getNavigationBadge(), fn () => SubscriptionResource::getNavigationBadgeColor()),
                    ]),
                NavigationItem::make('System')
                    ->sort(30)
                    ->childItems([
                        NavigationItem::make('Activity Logs')
                            ->icon('heroicon-o-clipboard-document-list')
                            ->url(fn () => ActivityLogResource::getUrl()),
                        NavigationItem::make('API-Zugänge')
                            ->icon('heroicon-o-key')
                            ->url(fn () => ApiAccessTokenResource::getUrl())
                            ->badge(fn () => ApiAccessTokenResource::getNavigationBadge()),
                        NavigationItem::make('API-Protokolle')
                            ->icon('heroicon-o-document-magnifying-glass')
                            ->url(fn () => ApiRequestLogResource::getUrl())
                            ->badge(fn () => ApiRequestLogResource::getNavigationBadge(), fn () => ApiRequestLogResource::getNavigationBadgeColor()),
                    ]),
                NavigationItem::make('Stammdaten')
                    ->sort(40)
                    ->childItems([
                        NavigationItem::make('Module')
                            ->icon('heroicon-o-squares-plus')
                            ->url(fn () => Modules::getUrl()),
                        NavigationItem::make('Leistungspakete')
                            ->icon('heroicon-o-gift')
                            ->url(fn () => Packages::getUrl()),
                    ]),
                NavigationItem::make('Support')
                    ->sort(50)
                    ->childItems([
                        NavigationItem::make('Kontakt')
                            ->icon('heroicon-o-envelope')
                            ->url(fn () => Contact::getUrl()),
                        NavigationItem::make('Kundensupport')
                            ->icon('heroicon-o-lifebuoy')
                            ->url(fn () => CustomerSupport::getUrl()),
                        NavigationItem::make('Tickets')
                            ->icon('heroicon-o-ticket')
                            ->url(fn () => Tickets::getUrl()),
                    ]),
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
                FilamentInfoWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
