<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DishService;
use App\Http\Requests\StoreDishRequest;
use App\Http\Requests\UpdateDishRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DishController extends Controller
{
    protected DishService $dishService;

    public function __construct(DishService $dishService)
    {
        $this->dishService = $dishService;
    }

    public function index(): JsonResponse
    {
        $dishes = $this->dishService->getAllDishes();
        return response()->json($dishes);
    }

    public function store(StoreDishRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Remove image parameter from validated array if present (it is validated separately)
        unset($validated['image']);

        $imageFile = $request->file('image');

        $dish = $this->dishService->createDish($validated, $imageFile);
        
        // Load the category relation for response consistency
        $dish->load('category');

        return response()->json($dish, 201);
    }

    public function show(int $id): JsonResponse
    {
        $dish = $this->dishService->getDishById($id);
        if (!$dish) {
            return response()->json(['message' => 'Plato no encontrado.'], 404);
        }
        $dish->load('category');
        return response()->json($dish);
    }

    public function update(UpdateDishRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();
        
        // Remove image parameter from validated array
        unset($validated['image']);

        $imageFile = $request->file('image');

        $updated = $this->dishService->updateDish($id, $validated, $imageFile);

        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar el plato.'], 400);
        }

        $dish = $this->dishService->getDishById($id);
        $dish->load('category');
        return response()->json($dish);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->dishService->deleteDish($id);
        if (!$deleted) {
            return response()->json(['message' => 'No se pudo eliminar el plato.'], 400);
        }
        return response()->json(['message' => 'Plato eliminado con éxito.']);
    }

    public function toggleAvailability(int $id): JsonResponse
    {
        $toggled = $this->dishService->toggleAvailability($id);
        if (!$toggled) {
            return response()->json(['message' => 'No se pudo cambiar la disponibilidad.'], 400);
        }
        
        $dish = $this->dishService->getDishById($id);
        $dish->load('category');
        
        return response()->json([
            'message' => 'Disponibilidad de plato actualizada.',
            'dish' => $dish
        ]);
    }
}
