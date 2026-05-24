<?php

namespace App\Repositories\Eloquent;

use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class OrderRepository extends BaseRepository implements OrderRepositoryInterface
{
    public function __construct(Order $model)
    {
        parent::__construct($model);
    }

    public function getPendingKitchenOrders(): Collection
    {
        return $this->model->with(['items.dish', 'table', 'user', 'waiter'])
            ->whereIn('status', ['pendiente', 'preparando'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function updateOrderStatus(int $orderId, string $status): bool
    {
        return $this->update($orderId, ['status' => $status]);
    }

    public function createWithItems(array $data): Order
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items']);

            // Create the main Order
            /** @var Order $order */
            $order = $this->model->create($data);

            // Create each OrderItem associated with the order
            foreach ($items as $item) {
                $order->items()->create([
                    'dish_id' => $item['dish_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // Update associated Table status to 'busy'
            if (!empty($order->table_id)) {
                \App\Models\Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            return $order->load(['items.dish', 'table', 'waiter', 'user']);
        });
    }

    public function getAllOrdersWithRelations(): Collection
    {
        return $this->model->with(['items.dish', 'table', 'waiter', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
