<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function create(User $user): bool
    {
        return $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->isOwner();
    }

    public function issue(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->isOwner();
    }
}
