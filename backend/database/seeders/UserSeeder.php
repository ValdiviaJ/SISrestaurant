<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();
        $mozoRole = Role::where('slug', 'mozo')->first();
        $cajeroRole = Role::where('slug', 'cajero')->first();
        $cocinaRole = Role::where('slug', 'cocina')->first();

        // Create Admin
        User::firstOrCreate(
            ['email' => 'admin@restosuite.com'],
            [
                'name' => 'Admin RestoSuite',
                'password' => Hash::make('password'),
                'role_id' => $adminRole?->id,
            ]
        );

        // Create Mozo
        User::firstOrCreate(
            ['email' => 'mozo@restosuite.com'],
            [
                'name' => 'Juan Mozo',
                'password' => Hash::make('password'),
                'role_id' => $mozoRole?->id,
            ]
        );

        // Create Cajero
        User::firstOrCreate(
            ['email' => 'cajero@restosuite.com'],
            [
                'name' => 'Ana Cajera',
                'password' => Hash::make('password'),
                'role_id' => $cajeroRole?->id,
            ]
        );

        // Create Cocinero
        User::firstOrCreate(
            ['email' => 'cocina@restosuite.com'],
            [
                'name' => 'Pedro Cocinero',
                'password' => Hash::make('password'),
                'role_id' => $cocinaRole?->id,
            ]
        );
    }
}
