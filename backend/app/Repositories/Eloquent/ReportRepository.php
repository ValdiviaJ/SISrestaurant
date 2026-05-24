<?php

namespace App\Repositories\Eloquent;

use App\Models\Order;
use App\Repositories\Contracts\ReportRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportRepository extends BaseRepository implements ReportRepositoryInterface
{
    public function __construct(Order $model)
    {
        parent::__construct($model);
    }

    /**
     * Get basic sales summary (total sales amount and orders count).
     */
    public function getSalesSummary(string $startDate, string $endDate): array
    {
        $result = $this->model
            ->where('status', 'pagado')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('COUNT(id) as orders_count, COALESCE(SUM(total), 0) as total_sales')
            ->first();

        $totalSales = (float) $result->total_sales;
        $ordersCount = (int) $result->orders_count;
        $averageTicket = $ordersCount > 0 ? $totalSales / $ordersCount : 0;

        return [
            'total_sales' => $totalSales,
            'orders_count' => $ordersCount,
            'average_ticket' => round($averageTicket, 2),
        ];
    }

    /**
     * Get daily sales data for charting.
     */
    public function getSalesByDate(string $startDate, string $endDate): Collection
    {
        return $this->model
            ->where('status', 'pagado')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COALESCE(SUM(total), 0) as total'))
            ->orderBy('date', 'asc')
            ->get();
    }

    /**
     * Get top selling dishes.
     */
    public function getBestSellers(string $startDate, string $endDate, int $limit = 5): Collection
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('dishes', 'order_items.dish_id', '=', 'dishes.id')
            ->where('orders.status', 'pagado')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('dishes.id', 'dishes.name')
            ->select(
                'dishes.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as revenue')
            )
            ->orderBy('quantity_sold', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get count of orders grouped by their statuses.
     */
    public function getOrdersVolume(string $startDate, string $endDate): array
    {
        $results = $this->model
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->select('status', DB::raw('COUNT(id) as count'))
            ->get();

        $volume = [
            'pendiente' => 0,
            'preparando' => 0,
            'listo' => 0,
            'entregado' => 0,
            'pagado' => 0,
            'cancelado' => 0,
        ];

        foreach ($results as $res) {
            $volume[$res->status] = (int) $res->count;
        }

        return $volume;
    }

    /**
     * Get distribution and counts of payment methods.
     */
    public function getPaymentMethodsBreakdown(string $startDate, string $endDate): Collection
    {
        return DB::table('payments')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('payment_method')
            ->select(
                'payment_method',
                DB::raw('COUNT(id) as count'),
                DB::raw('COALESCE(SUM(amount), 0) as total_amount')
            )
            ->get();
    }
}
