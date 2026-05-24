<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    protected CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index(): JsonResponse
    {
        $categories = $this->categoryService->getAllCategories();
        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categoryService->createCategory($request->validated());
        return response()->json($category, 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = $this->categoryService->getCategoryById($id);
        if (!$category) {
            return response()->json(['message' => 'Categoría no encontrada.'], 404);
        }
        return response()->json($category);
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $updated = $this->categoryService->updateCategory($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar la categoría.'], 400);
        }
        $category = $this->categoryService->getCategoryById($id);
        return response()->json($category);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->categoryService->deleteCategory($id);
        if (!$deleted) {
            return response()->json(['message' => 'No se pudo eliminar la categoría.'], 400);
        }
        return response()->json(['message' => 'Categoría eliminada con éxito.']);
    }
}
