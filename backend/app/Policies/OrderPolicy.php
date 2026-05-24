<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Order;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Admins, Cashiers, Waiters, and Kitchen staff can view orders
        return in_array($user->role->slug, ['admin', 'cajero', 'mozo', 'cocina']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Waiters and Admins register orders
        return in_array($user->role->slug, ['admin', 'mozo', 'cajero']);
    }

    /**
     * Determine whether the user can update the model status.
     */
    public function updateStatus(User $user, Order $order): bool
    {
        // Kitchen staff can update status to 'preparando' and 'listo'
        // Waiters or cashiers can mark as 'entregado'
        // Admins can do everything
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('cocina')) {
            return in_array($order->status, ['pendiente', 'preparando']);
        }

        if (in_array($user->role->slug, ['mozo', 'cajero'])) {
            return $order->status === 'listo'; // Mark as delivered
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Order $order): bool
    {
        // Only Admin can cancel/delete registered orders
        return $user->hasRole('admin');
    }
}
