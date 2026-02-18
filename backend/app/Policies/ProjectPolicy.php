<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->hasMinRole(User::ROLE_EMPLOYEE);
    }

    public function update(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id
            && $user->hasMinRole(User::ROLE_MANAGER);
    }

    public function forceDelete(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id
            && $user->isOwner();
    }
}
