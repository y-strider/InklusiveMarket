<?php

namespace App\Policies;

use App\Models\Listing;
use App\Models\User;

class ListingPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Listing $listing): bool
    {
        if ($listing->visibility === 'public' && $listing->status === 'active') return true;
        if (!$user) return false;
        if ($user->id === $listing->seller_id) return true;
        if ($user->isModerator()) return true;
        return false;
    }

    public function create(User $user): bool
    {
        return $user->isSeller() && $user->isSellerOnboarded() && !$user->isSuspended();
    }

    public function update(User $user, Listing $listing): bool
    {
        if ($user->isSuspended()) return false;
        if ($user->isAdmin()) return true;
        return $user->id === $listing->seller_id;
    }

    public function delete(User $user, Listing $listing): bool
    {
        if ($user->isAdmin()) return true;
        return $user->id === $listing->seller_id;
    }

    public function publish(User $user, Listing $listing): bool
    {
        if ($user->isSuspended()) return false;
        return $user->id === $listing->seller_id && $user->isSellerOnboarded();
    }

    public function moderate(User $user, Listing $listing): bool
    {
        return $user->isModerator();
    }

    public function report(?User $user, Listing $listing): bool
    {
        return $user !== null && $user->id !== $listing->seller_id;
    }
}
