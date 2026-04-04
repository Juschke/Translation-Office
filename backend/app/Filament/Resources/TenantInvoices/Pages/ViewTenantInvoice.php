<?php

namespace App\Filament\Resources\TenantInvoices\Pages;

use App\Filament\Resources\TenantInvoices\TenantInvoiceResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewTenantInvoice extends ViewRecord
{
    protected static string $resource = TenantInvoiceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
