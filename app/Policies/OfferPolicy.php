<?php

namespace App\Policies;

use App\Models\Listing;
use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function create(User $user, Listing $listing): bool
    {
        return $listing->allows_offers
            && $listing->isActive()
            && $user->id !== $listing->seller_id
            && !$user->isSuspended();
    }

    public function respond(User $user, Offer $offer): bool
    {
        return $user->id === $offer->seller_id && $offer->isPending() && !$offer->isExpired();
    }

    public function withdraw(User $user, Offer $offer): bool
    {
        return $user->id === $offer->buyer_id && $offer->isPending();
    }
}
