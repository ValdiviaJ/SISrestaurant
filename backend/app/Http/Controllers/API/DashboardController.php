<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get real-time operational stats card values.
     */
    public function getStats(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        return response()->json($this->dashboardService->getStats());
    }

    /**
     * Get chronological sales data for dashboard chart.
     */
    public function getSalesChartData(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        $period = $request->query('period', '7d');
        if (!in_array($period, ['7d', 'month', 'year'])) {
            return response()->json(['message' => 'Periodo no válido. Use 7d, month o year.'], 422);
        }

        return response()->json($this->dashboardService->getSalesChartData($period));
    }

    /**
     * Get top selling dishes with revenue.
     */
    public function getBestSellers(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        $limit = $request->query('limit', 5);
        return response()->json($this->dashboardService->getBestSellers((int) $limit));
    }
}
