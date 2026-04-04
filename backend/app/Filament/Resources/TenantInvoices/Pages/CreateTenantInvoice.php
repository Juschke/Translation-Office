<?php

namespace App\Filament\Resources\TenantInvoices\Pages;

use App\Filament\Resources\TenantInvoices\TenantInvoiceResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTenantInvoice extends CreateRecord
{
    protected static string $resource = TenantInvoiceResource::class;
}
