<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo accounts for testing and review. These are sample credentials only,
 * not real passwords.
 */
class UserSeeder extends Seeder
{
    public const ACCOUNTS = [
        ['name' => 'Admin User', 'email' => 'admin@example.com', 'password' => 'Admin@123', 'role' => UserRole::Admin],
        ['name' => 'Alice Sharma', 'email' => 'alice@example.com', 'password' => 'User@1234', 'role' => UserRole::User],
        ['name' => 'Bob Kumar', 'email' => 'bob@example.com', 'password' => 'User@1234', 'role' => UserRole::User],
    ];

    public function run(): void
    {
        foreach (self::ACCOUNTS as $account) {
            $user = User::firstOrNew(['email' => $account['email']]);
            if ($user->exists) {
                continue;
            }

            $user->fill([
                'name' => $account['name'],
                'password' => $account['password'], // hashed by the model cast
            ]);
            // role is not mass-assignable, so it is set explicitly.
            $user->role = $account['role'];
            $user->email_verified_at = now();
            $user->save();
        }
    }
}
