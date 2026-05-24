<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Parse date range from request or fallback to last 30 days.
     */
    private function getDates(Request $request): array
    {
        $startDate = $request->query('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', Carbon::now()->toDateString());

        // Format dates as start and end of day timestamps
        $startDateTime = Carbon::parse($startDate)->startOfDay()->toDateTimeString();
        $endDateTime = Carbon::parse($endDate)->endOfDay()->toDateTimeString();

        return [$startDateTime, $endDateTime];
    }

    /**
     * Get sales summary.
     */
    public function getSalesSummary(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        list($start, $end) = $this->getDates($request);
        $data = $this->reportService->getSalesSummary($start, $end);
        
        return response()->json($data);
    }

    /**
     * Get best selling dishes.
     */
    public function getBestSellers(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        list($start, $end) = $this->getDates($request);
        $limit = $request->query('limit', 5);
        $data = $this->reportService->getBestSellers($start, $end, (int) $limit);
        
        return response()->json($data);
    }

    /**
     * Get orders volume & payment methods breakdown.
     */
    public function getOrdersVolume(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403);
        }

        list($start, $end) = $this->getDates($request);
        $data = $this->reportService->getOrdersVolume($start, $end);
        
        return response()->json($data);
    }
}
