<?php

namespace App\Filament\Resources\TenantInvoices\Pages;

use App\Filament\Resources\TenantInvoices\TenantInvoiceResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTenantInvoice extends EditRecord
{
    protected static string $resource = TenantInvoiceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
