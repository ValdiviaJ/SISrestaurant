<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrador',
                'slug' => 'admin',
            ],
            [
                'name' => 'Mozo',
                'slug' => 'mozo',
            ],
            [
                'name' => 'Cajero',
                'slug' => 'cajero',
            ],
            [
                'name' => 'Cocina',
                'slug' => 'cocina',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
