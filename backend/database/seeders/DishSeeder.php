<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Dish;
use Illuminate\Database\Seeder;

class DishSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entradas = Category::where('slug', 'entradas')->first();
        $fondos = Category::where('slug', 'platos-de-fondo')->first();
        $postres = Category::where('slug', 'postres')->first();
        $bebidas = Category::where('slug', 'bebidas')->first();
        $guarniciones = Category::where('slug', 'guarniciones')->first();

        $dishes = [
            // Entradas
            [
                'category_id' => $entradas?->id,
                'name' => 'Ceviche Clásico',
                'description' => 'Fresco pescado marinado en jugo de limón, ají limo, cilantro, servido con camote y choclo.',
                'price' => 32.00,
                'image_url' => 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],
            [
                'category_id' => $entradas?->id,
                'name' => 'Causa Rellena de Pollo',
                'description' => 'Masa de papa amarilla sazonada con ají amarillo y limón, rellena de pechuga de pollo deshilachada y palta.',
                'price' => 18.00,
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],
            [
                'category_id' => $entradas?->id,
                'name' => 'Papa a la Huancaína',
                'description' => 'Papas sancochadas bañadas en una suave crema de queso, ají amarillo y leche, decorada con huevo y aceituna.',
                'price' => 15.00,
                'image_url' => null,
                'is_available' => true,
            ],

            // Platos de Fondo
            [
                'category_id' => $fondos?->id,
                'name' => 'Lomo Saltado',
                'description' => 'Trozos de lomo de res salteados al wok con cebolla, tomate, ají amarillo, un toque de pisco, acompañados de papas fritas y arroz.',
                'price' => 45.00,
                'image_url' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],
            [
                'category_id' => $fondos?->id,
                'name' => 'Ají de Gallina',
                'description' => 'Pechuga de gallina deshilachada en una crema a base de ají amarillo, leche y nueces, acompañado de arroz blanco, papa y huevo duro.',
                'price' => 38.00,
                'image_url' => 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],
            [
                'category_id' => $fondos?->id,
                'name' => 'Arroz con Mariscos',
                'description' => 'Arroz criollo sazonado con ají panca y culantro, salteado con camarones, calamares, pulpo y mejillones.',
                'price' => 42.00,
                'image_url' => null,
                'is_available' => true,
            ],
            [
                'category_id' => $fondos?->id,
                'name' => 'Seco de Res con Frijoles',
                'description' => 'Carne de res guisada a fuego lento en una salsa de culantro y chicha de jora, acompañado de frijoles cremosos y arroz.',
                'price' => 40.00,
                'image_url' => null,
                'is_available' => true,
            ],

            // Postres
            [
                'category_id' => $postres?->id,
                'name' => 'Suspiro a la Limeña',
                'description' => 'Tradicional dulce de leche condensada y evaporada coronado con un merengue aromatizado al oporto y canela.',
                'price' => 12.00,
                'image_url' => null,
                'is_available' => true,
            ],
            [
                'category_id' => $postres?->id,
                'name' => 'Crema Volteada',
                'description' => 'Flan clásico peruano, suave y bañado en caramelo líquido.',
                'price' => 10.00,
                'image_url' => 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],

            // Bebidas
            [
                'category_id' => $bebidas?->id,
                'name' => 'Chicha Morada (1L)',
                'description' => 'Bebida tradicional de maíz morado hervido con piña, manzana, canela, clavo de olor y un toque de limón.',
                'price' => 15.00,
                'image_url' => null,
                'is_available' => true,
            ],
            [
                'category_id' => $bebidas?->id,
                'name' => 'Pisco Sour Clásico',
                'description' => 'Coctel bandera a base de pisco quebranta, jugo de limón, jarabe de goma, clara de huevo y amargo de angostura.',
                'price' => 22.00,
                'image_url' => 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
                'is_available' => true,
            ],
            [
                'category_id' => $bebidas?->id,
                'name' => 'Inca Kola Personal',
                'description' => 'Gaseosa nacional en botella de vidrio de 350ml.',
                'price' => 6.00,
                'image_url' => null,
                'is_available' => true,
            ],

            // Guarniciones
            [
                'category_id' => $guarniciones?->id,
                'name' => 'Papas Fritas Tumbay',
                'description' => 'Porción de papas nativas fritas, crocantes por fuera y suaves por dentro.',
                'price' => 8.00,
                'image_url' => null,
                'is_available' => true,
            ],
            [
                'category_id' => $guarniciones?->id,
                'name' => 'Arroz Blanco con Choclo',
                'description' => 'Porción de arroz blanco bien graneado aromatizado con ajo y choclo desgranado.',
                'price' => 6.00,
                'image_url' => null,
                'is_available' => true,
            ],
        ];

        foreach ($dishes as $dish) {
            if ($dish['category_id']) {
                Dish::firstOrCreate(
                    [
                        'category_id' => $dish['category_id'],
                        'name' => $dish['name']
                    ],
                    $dish
                );
            }
        }
    }
}
