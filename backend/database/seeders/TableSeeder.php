<?php

namespace Database\Seeders;

use App\Models\Table;
use Illuminate\Database\Seeder;

class TableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tables = [
            [
                'number' => 1,
                'capacity' => 2,
                'status' => 'free',
            ],
            [
                'number' => 2,
                'capacity' => 2,
                'status' => 'free',
            ],
            [
                'number' => 3,
                'capacity' => 4,
                'status' => 'free',
            ],
            [
                'number' => 4,
                'capacity' => 4,
                'status' => 'free',
            ],
            [
                'number' => 5,
                'capacity' => 4,
                'status' => 'free',
            ],
            [
                'number' => 6,
                'capacity' => 6,
                'status' => 'free',
            ],
            [
                'number' => 7,
                'capacity' => 6,
                'status' => 'free',
            ],
            [
                'number' => 8,
                'capacity' => 8,
                'status' => 'free',
            ],
        ];

        foreach ($tables as $table) {
            Table::firstOrCreate(['number' => $table['number']], $table);
        }
    }
}
