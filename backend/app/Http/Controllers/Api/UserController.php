<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('name')->get([
            'id', 'name', 'email', 'role', 'status', 'last_login_at', 'created_at',
        ]);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'role'     => ['required', Rule::in([User::ROLE_MANAGER, User::ROLE_EMPLOYEE])],
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'],
            'status'    => 'active',
            'tenant_id' => auth()->user()->tenant_id,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role'     => ['sometimes', Rule::in([User::ROLE_MANAGER, User::ROLE_EMPLOYEE])],
            'status'   => 'sometimes|in:active,inactive',
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        // Owner cannot change their own role or status
        if ($user->id === auth()->id()) {
            unset($validated['role'], $validated['status']);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Sie können sich nicht selbst löschen.'], 422);
        }

        if ($user->isOwner()) {
            return response()->json(['message' => 'Der Inhaber kann nicht gelöscht werden.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Mitarbeiter wurde gelöscht.']);
    }
}
