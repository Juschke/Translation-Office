<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Packages extends Page
{
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-gift';

    protected static ?string $navigationLabel = 'Leistungspakete';

    protected static ?string $title = 'Leistungspakete verwalten';

    protected static \UnitEnum|string|null $navigationGroup = 'Stammdaten';

    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.packages';
}
