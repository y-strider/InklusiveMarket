<?php

namespace App\Policies;

use App\Models\Listing;
use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function create(User $user, Listing $listing): bool
    {
        return $listing->allowsoffers
            && $listing->isActive()
            && $user->id !== $listing->sellerid
            && !$user->isSuspended();
    }

    public function respond(User $user, Offer $offer): bool
    {
        return $user->id === $offer->sellerid && $offer->isPending() && !$offer->isExpired();
    }

    public function withdraw(User $user, Offer $offer): bool
    {
        return $user->id === $offer->buyerid && $offer->isPending();
    }
}
