<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Modules extends Page
{
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-squares-plus';

    protected static ?string $navigationLabel = 'Module';

    protected static ?string $title = 'Module freischalten';

    protected static \UnitEnum|string|null $navigationGroup = 'Stammdaten';

    protected static ?int $navigationSort = 2;

    protected string $view = 'filament.pages.modules';
}
