<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Contact extends Page
{
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-envelope';

    protected static ?string $navigationLabel = 'Kontakt';

    protected static ?string $title = 'Kontaktanfragen';

    protected static \UnitEnum|string|null $navigationGroup = 'Support';

    protected static ?int $navigationSort = 2;

    protected string $view = 'filament.pages.contact';
}
