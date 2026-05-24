<?php

namespace App\Repositories\Contracts;

use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;

interface OrderRepositoryInterface extends RepositoryInterface
{
    public function getPendingKitchenOrders(): Collection;
    
    public function updateOrderStatus(int $orderId, string $status): bool;

    public function createWithItems(array $data): Order;

    public function getAllOrdersWithRelations(): Collection;
}
