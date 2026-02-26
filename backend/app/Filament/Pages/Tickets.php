<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Tickets extends Page
{
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-ticket';

    protected static ?string $navigationLabel = 'Tickets';

    protected static ?string $title = 'Support Tickets';

    protected static \UnitEnum|string|null $navigationGroup = 'Support';

    protected static ?int $navigationSort = 3;

    protected string $view = 'filament.pages.tickets';
}
