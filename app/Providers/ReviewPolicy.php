<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function create(User $user, Order $order): bool
    {
        return $user->id === $order->buyerid && $order->canBeReviewed();
    }

    public function reply(User $user, Review $review): bool
    {
        return $user->id === $review->revieweeid && !$review->hasReply();
    }

    public function moderate(User $user, Review $review): bool
    {
        return $user->isModerator();
    }
}
