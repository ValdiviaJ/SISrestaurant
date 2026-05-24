<?php

namespace App\Services;

use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;

class OrderService extends BaseService
{
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    public function getActiveOrdersForKitchen(): Collection
    {
        return $this->orderRepository->getPendingKitchenOrders();
    }

    public function getAllOrders(): Collection
    {
        return $this->orderRepository->getAllOrdersWithRelations();
    }

    public function registerNewOrder(array $data): Order
    {
        // Business logic: check table, validate items availability, calculate taxes
        $data['status'] = 'pendiente';
        
        /** @var Order $order */
        $order = $this->orderRepository->createWithItems($data);

        // Dispatch WebSocket Event for Kitchen Board (Reverb/Pusher)
        // event(new \App\Events\OrderCreatedEvent($order));

        return $order;
    }

    public function changeStatus(int $orderId, string $status): bool
    {
        $updated = $this->orderRepository->updateOrderStatus($orderId, $status);

        if ($updated) {
            // Dispatch WebSocket Event for status tracking
            // event(new \App\Events\OrderStatusChangedEvent($orderId, $status));
        }

        return $updated;
    }
}
