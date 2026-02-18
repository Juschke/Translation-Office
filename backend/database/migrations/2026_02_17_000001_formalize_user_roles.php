<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize existing role values to the new enum
        // The registering user (tenant creator) gets 'owner'
        // Invited users with role 'user' get 'employee'
        // Users with role 'admin' who are NOT is_admin get 'owner' (they created the tenant)
        DB::table('users')->where('role', 'admin')->where('is_admin', false)->update(['role' => 'owner']);
        DB::table('users')->where('role', 'admin')->where('is_admin', true)->update(['role' => 'owner']);
        DB::table('users')->where('role', 'user')->update(['role' => 'employee']);
        DB::table('users')->where('role', 'Project Manager')->update(['role' => 'manager']);

        // Catch any remaining non-standard values
        DB::table('users')
            ->whereNotIn('role', ['owner', 'manager', 'employee'])
            ->update(['role' => 'employee']);
    }

    public function down(): void
    {
        // Reverse: owner -> admin, manager -> Project Manager, employee -> user
        DB::table('users')->where('role', 'owner')->update(['role' => 'admin']);
        DB::table('users')->where('role', 'manager')->update(['role' => 'Project Manager']);
        DB::table('users')->where('role', 'employee')->update(['role' => 'user']);
    }
};
