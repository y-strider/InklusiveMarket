<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        if ($user->isAdmin()) {
            return true;
        }
        return $user->id === $order->buyerid || $user->id === $order->sellerid;
    }

    public function cancel(User $user, Order $order): bool
    {
        if (!$order->canBeCancelled()) {
            return false;
        }
        if ($user->isAdmin()) {
            return true;
        }
        return $user->id === $order->buyerid || $user->id === $order->sellerid;
    }

    public function ship(User $user, Order $order): bool
    {
        return $user->id === $order->sellerid && in_array($order->status, ['paid', 'processing'], true);
    }

    public function complete(User $user, Order $order): bool
    {
        return ($user->id === $order->buyerid || $user->isAdmin())
            && $order->status === Order::STATUSDELIVERED;
    }

    public function dispute(User $user, Order $order): bool
    {
        return $user->id === $order->buyerid && $order->canBeDisputed();
    }

    public function review(User $user, Order $order): bool
    {
        return $user->id === $order->buyerid && $order->canBeReviewed();
    }

    public function manageAll(User $user): bool
    {
        return $user->isAdmin();
    }
}
