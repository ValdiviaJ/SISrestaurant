<?php

namespace App\Services;

use App\Repositories\Contracts\ReportRepositoryInterface;
use Illuminate\Support\Collection;

class ReportService extends BaseService
{
    protected ReportRepositoryInterface $reportRepository;

    public function __construct(ReportRepositoryInterface $reportRepository)
    {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Get consolidated sales summary and daily sales list.
     */
    public function getSalesSummary(string $startDate, string $endDate): array
    {
        $summary = $this->reportRepository->getSalesSummary($startDate, $endDate);
        $salesByDate = $this->reportRepository->getSalesByDate($startDate, $endDate);

        return array_merge($summary, [
            'sales_by_date' => $salesByDate
        ]);
    }

    /**
     * Get top selling dishes.
     */
    public function getBestSellers(string $startDate, string $endDate, int $limit = 5): Collection
    {
        return $this->reportRepository->getBestSellers($startDate, $endDate, $limit);
    }

    /**
     * Get orders count grouped by status and payment methods breakdown.
     */
    public function getOrdersVolume(string $startDate, string $endDate): array
    {
        $volume = $this->reportRepository->getOrdersVolume($startDate, $endDate);
        $payments = $this->reportRepository->getPaymentMethodsBreakdown($startDate, $endDate);

        return [
            'orders_volume' => $volume,
            'payment_methods' => $payments
        ];
    }
}
