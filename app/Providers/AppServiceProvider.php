<?php

namespace App\Providers;

use App\Models\Conversation;
use App\Models\Listing;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use App\Policies\ConversationPolicy;
use App\Policies\ListingPolicy;
use App\Policies\OfferPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ReviewPolicy;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        Paginator::useTailwind();

        Gate::policy(Listing::class, ListingPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Offer::class, OfferPolicy::class);
        Gate::policy(Review::class, ReviewPolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);

        Relation::morphMap([
            'listing' => Listing::class,
            'review' => Review::class,
            'user' => User::class,
        ]);
    }
}
