<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class CustomerSupport extends Page
{
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-lifebuoy';

    protected static \UnitEnum|string|null $navigationGroup = 'Support';

    protected static ?string $navigationLabel = 'Kundensupport';

    protected static ?string $title = 'Kundensupport Dashboard';

    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.customer-support';
}
