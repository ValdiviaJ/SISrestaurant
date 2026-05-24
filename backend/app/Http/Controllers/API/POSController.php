<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class POSController extends Controller
{
    /**
     * Get unpaid active orders.
     */
    public function getUnpaidOrders(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cajero')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de caja.'], 403);
        }

        // Active orders that are NOT paid ('pagado') or cancelled ('cancelado')
        $orders = Order::with(['items.dish', 'table', 'user'])
            ->whereNotIn('status', ['pagado', 'cancelado'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Get available payment methods.
     */
    public function getPaymentMethods(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cajero')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de caja.'], 403);
        }

        return response()->json([
            ['id' => 'cash', 'name' => 'Efectivo'],
            ['id' => 'card', 'name' => 'Tarjeta'],
            ['id' => 'transfer', 'name' => 'Yape / Plin / Transferencia'],
        ]);
    }

    /**
     * Process checkout/payment for an order (existing or new direct sale).
     */
    public function processCheckout(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('cajero')) {
            return response()->json(['message' => 'No autorizado. Se requieren permisos de caja.'], 403);
        }

        $request->validate([
            'order_id' => 'nullable|integer|exists:orders,id',
            'payment_method' => 'required|string|in:cash,card,transfer',
            'amount' => 'required|numeric|min:0',
            // Fields below are for direct sale if order_id is not provided
            'table_id' => 'nullable|integer|exists:tables,id',
            'items' => 'required_without:order_id|array',
            'items.*.dish_id' => 'required_with:items|integer|exists:dishes,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.price' => 'required_with:items|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $orderId = $request->input('order_id');
        $paymentMethod = $request->input('payment_method');
        $amount = $request->input('amount');

        return DB::transaction(function () use ($orderId, $paymentMethod, $amount, $request) {
            if ($orderId) {
                // Checkout an existing order
                $order = Order::find($orderId);

                if (in_array($order->status, ['pagado', 'cancelado'])) {
                    return response()->json(['message' => 'El pedido ya está pagado o cancelado.'], 422);
                }

                // Create the payment
                $payment = Payment::create([
                    'order_id' => $order->id,
                    'payment_method' => $paymentMethod,
                    'amount' => $amount,
                ]);

                // Update order status
                $order->update(['status' => 'pagado']);

                // Release table status to free
                if ($order->table_id) {
                    Table::where('id', $order->table_id)->update(['status' => 'free']);
                }

                $order->load(['items.dish', 'table', 'user']);

                return response()->json([
                    'message' => 'Pago procesado y mesa liberada con éxito.',
                    'payment' => $payment,
                    'order' => $order
                ]);
            } else {
                // Direct sale / Fast order
                $tableId = $request->input('table_id');
                $items = $request->input('items', []);

                // Create order directly as 'pagado'
                $order = Order::create([
                    'user_id' => $request->user()->id,
                    'table_id' => $tableId,
                    'status' => 'pagado',
                    'total' => $amount,
                    'notes' => $request->input('notes'),
                ]);

                // Register order items
                foreach ($items as $item) {
                    $order->items()->create([
                        'dish_id' => $item['dish_id'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }

                // Create payment
                $payment = Payment::create([
                    'order_id' => $order->id,
                    'payment_method' => $paymentMethod,
                    'amount' => $amount,
                ]);

                // Release the table just in case it was selected and busy (or keep it free)
                if ($tableId) {
                    Table::where('id', $tableId)->update(['status' => 'free']);
                }

                $order->load(['items.dish', 'table', 'user']);

                return response()->json([
                    'message' => 'Venta rápida procesada y registrada con éxito.',
                    'payment' => $payment,
                    'order' => $order
                ], 201);
            }
        });
    }
}
