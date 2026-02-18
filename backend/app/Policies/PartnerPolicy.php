<?php

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class PartnerPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Partner $partner): bool
    {
        return $user->tenant_id === $partner->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function update(User $user, Partner $partner): bool
    {
        return $user->tenant_id === $partner->tenant_id
            && $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function delete(User $user, Partner $partner): bool
    {
        return $user->tenant_id === $partner->tenant_id
            && $user->isOwner();
    }
}
