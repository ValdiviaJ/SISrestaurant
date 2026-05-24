<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\TableService;
use App\Http\Requests\StoreTableRequest;
use App\Http\Requests\UpdateTableRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    protected TableService $tableService;

    public function __construct(TableService $tableService)
    {
        $this->tableService = $tableService;
    }

    public function index(): JsonResponse
    {
        $tables = $this->tableService->getAllTables();
        return response()->json($tables);
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = $this->tableService->createTable($request->validated());
        return response()->json($table, 201);
    }

    public function show(int $id): JsonResponse
    {
        $table = $this->tableService->getTableById($id);
        if (!$table) {
            return response()->json(['message' => 'Mesa no encontrada.'], 404);
        }
        return response()->json($table);
    }

    public function update(UpdateTableRequest $request, int $id): JsonResponse
    {
        $updated = $this->tableService->updateTable($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar la mesa.'], 400);
        }
        $table = $this->tableService->getTableById($id);
        return response()->json($table);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->tableService->deleteTable($id);
        if (!$deleted) {
            return response()->json(['message' => 'No se pudo eliminar la mesa.'], 400);
        }
        return response()->json(['message' => 'Mesa eliminada con éxito.']);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:free,busy,reserved',
        ]);

        $updated = $this->tableService->updateTableStatus($id, $validated['status']);
        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar el estado de la mesa.'], 400);
        }

        $table = $this->tableService->getTableById($id);
        return response()->json([
            'message' => 'Estado de la mesa actualizado con éxito.',
            'table' => $table
        ]);
    }
}
