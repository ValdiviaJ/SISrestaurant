<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Get all active kitchen tickets (pending and preparing).
     */
    public function getPendingTickets(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cocina')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de cocina.'], 403);
        }

        $tickets = $this->orderService->getActiveOrdersForKitchen();
        return response()->json($tickets);
    }

    /**
     * Start preparation of a ticket.
     */
    public function startPreparation(Request $request, Order $order): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cocina')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de cocina.'], 403);
        }

        if ($order->status !== 'pendiente') {
            return response()->json(['message' => 'El pedido no está en estado pendiente para poder iniciar preparación.'], 400);
        }

        $updated = $this->orderService->changeStatus($order->id, 'preparando');

        if (!$updated) {
            return response()->json(['message' => 'No se pudo iniciar la preparación del pedido.'], 400);
        }

        $order->load(['items.dish', 'table', 'user', 'waiter']);

        return response()->json([
            'message' => 'Preparación iniciada.',
            'ticket' => $order
        ]);
    }

    /**
     * Mark a ticket as ready/completed in kitchen.
     */
    public function markAsReady(Request $request, Order $order): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cocina')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de cocina.'], 403);
        }

        if (!in_array($order->status, ['pendiente', 'preparando'])) {
            return response()->json(['message' => 'El pedido debe estar pendiente o en preparación para marcarse como listo.'], 400);
        }

        $updated = $this->orderService->changeStatus($order->id, 'listo');

        if (!$updated) {
            return response()->json(['message' => 'No se pudo marcar el pedido como listo.'], 400);
        }

        $order->load(['items.dish', 'table', 'user', 'waiter']);

        return response()->json([
            'message' => 'Pedido marcado como listo para servir.',
            'ticket' => $order
        ]);
    }
}
