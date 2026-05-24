<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Http\Requests\StoreOrderRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(): JsonResponse
    {
        $orders = $this->orderService->getAllOrders();
        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $order = $this->orderService->registerNewOrder($data);
        return response()->json($order, 201);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pendiente,preparando,listo,entregado',
        ]);

        $updated = $this->orderService->changeStatus($id, $request->input('status'));

        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar el pedido.'], 400);
        }

        $order = \App\Models\Order::with(['items.dish', 'table', 'waiter'])->find($id);

        return response()->json([
            'message' => 'Estado de pedido actualizado.',
            'order' => $order
        ]);
    }
}
