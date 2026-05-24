<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Entradas',
                'slug' => 'entradas',
                'description' => 'Aperitivos y platos pequeños para empezar.',
            ],
            [
                'name' => 'Platos de Fondo',
                'slug' => 'platos-de-fondo',
                'description' => 'Platos principales y especialidades de la casa.',
            ],
            [
                'name' => 'Postres',
                'slug' => 'postres',
                'description' => 'Delicias dulces para terminar la comida.',
            ],
            [
                'name' => 'Bebidas',
                'slug' => 'bebidas',
                'description' => 'Refrescos, jugos, cervezas y cocteles.',
            ],
            [
                'name' => 'Guarniciones',
                'slug' => 'guarniciones',
                'description' => 'Porciones extra para acompañar tus platos.',
            ],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
