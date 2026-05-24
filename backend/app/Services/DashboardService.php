<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Dish;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService extends BaseService
{
    /**
     * Get operational statistics for the dashboard.
     */
    public function getStats(): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();
        $yesterdayStart = Carbon::yesterday()->startOfDay();
        $yesterdayEnd = Carbon::yesterday()->endOfDay();

        // 1. Today's vs Yesterday's Sales
        $todaySales = (float) Order::where('status', 'pagado')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->sum('total');

        $yesterdaySales = (float) Order::where('status', 'pagado')
            ->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])
            ->sum('total');

        if ($yesterdaySales > 0) {
            $salesChangePct = (($todaySales - $yesterdaySales) / $yesterdaySales) * 100;
            $salesChange = ($salesChangePct >= 0 ? '+' : '') . number_format($salesChangePct, 1) . '%';
        } else {
            $salesChange = $todaySales > 0 ? '+100%' : '+0%';
        }

        // 2. Active Orders and New Orders
        $activeOrdersCount = Order::whereNotIn('status', ['pagado', 'cancelado'])->count();
        $newOrdersCount = Order::where('status', 'pendiente')->count();
        $ordersChange = $newOrdersCount . ' nuevos';

        // 3. Available Dishes vs Total Dishes
        $availableDishes = Dish::where('is_available', true)->count();
        $totalDishes = Dish::count();
        $dishesText = $availableDishes . ' / ' . $totalDishes;
        
        $dishChangePct = $totalDishes > 0 ? ($availableDishes / $totalDishes) * 100 : 100;
        $dishesChange = number_format($dishChangePct, 0) . '% activo';

        // 4. Staff on Duty / Total users
        $totalUsers = User::count();
        $staffChange = 'Roles listos';

        return [
            [
                'name' => 'Ventas del Día',
                'value' => $todaySales,
                'change' => $salesChange,
                'type' => 'currency'
            ],
            [
                'name' => 'Pedidos Activos',
                'value' => $activeOrdersCount,
                'change' => $ordersChange,
                'type' => 'number'
            ],
            [
                'name' => 'Platos Disponibles',
                'value' => $dishesText,
                'change' => $dishesChange,
                'type' => 'text'
            ],
            [
                'name' => 'Personal de Turno',
                'value' => $totalUsers,
                'change' => $staffChange,
                'type' => 'number'
            ]
        ];
    }

    /**
     * Get chart data of sales based on period (7d, month, year).
     */
    public function getSalesChartData(string $period): array
    {
        $points = [];
        $monthNames = [
            1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr', 5 => 'May', 6 => 'Jun',
            7 => 'Jul', 8 => 'Ago', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic'
        ];

        if ($period === 'year') {
            // Group by month
            $year = Carbon::today()->year;
            $startDate = Carbon::today()->startOfYear()->startOfDay();
            $endDate = Carbon::today()->endOfYear()->endOfDay();

            for ($m = 1; $m <= 12; $m++) {
                $monthKey = sprintf('%04d-%02d', $year, $m);
                $points[$monthKey] = [
                    'label' => $monthNames[$m],
                    'date' => $monthKey,
                    'total' => 0.00
                ];
            }

            $sales = Order::where('status', 'pagado')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy(DB::raw('DATE(created_at)'))
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COALESCE(SUM(total), 0) as total'))
                ->get();

            foreach ($sales as $sale) {
                $monthKey = Carbon::parse($sale->date)->format('Y-m');
                if (isset($points[$monthKey])) {
                    $points[$monthKey]['total'] += (float) $sale->total;
                }
            }
        } elseif ($period === 'month') {
            // Group by day of the month
            $daysInMonth = Carbon::today()->daysInMonth;
            $startOfMonth = Carbon::today()->startOfMonth();
            $startDate = $startOfMonth->copy()->startOfDay();
            $endDate = Carbon::today()->endOfMonth()->endOfDay();

            for ($i = 0; $i < $daysInMonth; $i++) {
                $dateObj = $startOfMonth->copy()->addDays($i);
                $dateKey = $dateObj->toDateString();
                $points[$dateKey] = [
                    'label' => $dateObj->format('d ') . $monthNames[(int)$dateObj->format('m')],
                    'date' => $dateKey,
                    'total' => 0.00
                ];
            }

            $sales = Order::where('status', 'pagado')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy(DB::raw('DATE(created_at)'))
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COALESCE(SUM(total), 0) as total'))
                ->get();

            foreach ($sales as $sale) {
                $dateKey = Carbon::parse($sale->date)->toDateString();
                if (isset($points[$dateKey])) {
                    $points[$dateKey]['total'] = (float) $sale->total;
                }
            }
        } else {
            // Default: '7d' (last 7 days)
            $startDate = Carbon::today()->subDays(6)->startOfDay();
            $endDate = Carbon::today()->endOfDay();

            for ($i = 6; $i >= 0; $i--) {
                $dateObj = Carbon::today()->subDays($i);
                $dateKey = $dateObj->toDateString();
                $points[$dateKey] = [
                    'label' => $dateObj->format('d ') . $monthNames[(int)$dateObj->format('m')],
                    'date' => $dateKey,
                    'total' => 0.00
                ];
            }

            $sales = Order::where('status', 'pagado')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy(DB::raw('DATE(created_at)'))
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COALESCE(SUM(total), 0) as total'))
                ->get();

            foreach ($sales as $sale) {
                $dateKey = Carbon::parse($sale->date)->toDateString();
                if (isset($points[$dateKey])) {
                    $points[$dateKey]['total'] = (float) $sale->total;
                }
            }
        }

        return array_values($points);
    }

    /**
     * Get top selling dishes of the current month (with fallback to 90 days if empty).
     */
    public function getBestSellers(int $limit = 5): array
    {
        // Try current month first
        $start = Carbon::now()->startOfMonth()->startOfDay();
        $end = Carbon::now()->endOfMonth()->endOfDay();

        $results = $this->queryBestSellers($start, $end, $limit);

        // Fallback to last 90 days if there are no sales in the current month
        if (count($results) === 0) {
            $startFallback = Carbon::now()->subDays(90)->startOfDay();
            $results = $this->queryBestSellers($startFallback, $end, $limit);
        }

        return $results;
    }

    /**
     * Helper to query best sellers database records.
     */
    private function queryBestSellers(Carbon $start, Carbon $end, int $limit): array
    {
        $dbData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('dishes', 'order_items.dish_id', '=', 'dishes.id')
            ->where('orders.status', 'pagado')
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupBy('dishes.id', 'dishes.name')
            ->select(
                'dishes.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as revenue')
            )
            ->orderBy('quantity_sold', 'desc')
            ->limit($limit)
            ->get();

        $formatted = [];
        foreach ($dbData as $row) {
            $formatted[] = [
                'name' => $row->name,
                'quantity_sold' => (int) $row->quantity_sold,
                'revenue' => (float) $row->revenue
            ];
        }

        return $formatted;
    }
}
