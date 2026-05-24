<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface ReportRepositoryInterface
{
    /**
     * Get basic sales summary (total sales amount and orders count).
     */
    public function getSalesSummary(string $startDate, string $endDate): array;

    /**
     * Get daily sales data for charting.
     */
    public function getSalesByDate(string $startDate, string $endDate): Collection;

    /**
     * Get top selling dishes.
     */
    public function getBestSellers(string $startDate, string $endDate, int $limit = 5): Collection;

    /**
     * Get count of orders grouped by their statuses.
     */
    public function getOrdersVolume(string $startDate, string $endDate): array;

    /**
     * Get distribution and counts of payment methods.
     */
    public function getPaymentMethodsBreakdown(string $startDate, string $endDate): Collection;
}
