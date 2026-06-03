<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $order->buyer_id || $user->id === $order->seller_id;
    }

    public function cancel(User $user, Order $order): bool
    {
        if (!$order->canBeCancelled()) return false;
        if ($user->isAdmin()) return true;
        return $user->id === $order->buyer_id || $user->id === $order->seller_id;
    }

    public function ship(User $user, Order $order): bool
    {
        return $user->id === $order->seller_id && in_array($order->status, ['paid', 'processing']);
    }

    public function complete(User $user, Order $order): bool
    {
        return ($user->id === $order->buyer_id || $user->isAdmin())
            && $order->status === Order::STATUS_DELIVERED;
    }

    public function dispute(User $user, Order $order): bool
    {
        return $user->id === $order->buyer_id && $order->canBeDisputed();
    }

    public function review(User $user, Order $order): bool
    {
        return $user->id === $order->buyer_id && $order->canBeReviewed();
    }

    public function manageAll(User $user): bool
    {
        return $user->isAdmin();
    }
}
