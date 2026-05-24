<?php

namespace Database\Seeders;

use App\Models\RestaurantConfig;
use Illuminate\Database\Seeder;

class RestaurantConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            [
                'key' => 'restaurant_name',
                'value' => 'RestoSuite',
            ],
            [
                'key' => 'ruc',
                'value' => '20123456789',
            ],
            [
                'key' => 'address',
                'value' => 'Av. Larco 123, Miraflores, Lima',
            ],
            [
                'key' => 'phone',
                'value' => '+51 987 654 321',
            ],
            [
                'key' => 'tax_percentage',
                'value' => '18', // IGV/IVA 18%
            ],
            [
                'key' => 'currency_symbol',
                'value' => 'S/', // Soles peruanos
            ],
            [
                'key' => 'currency_code',
                'value' => 'PEN',
            ],
        ];

        foreach ($configs as $config) {
            RestaurantConfig::firstOrCreate(['key' => $config['key']], $config);
        }
    }
}
