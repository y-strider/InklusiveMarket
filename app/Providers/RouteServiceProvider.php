<?php

namespace App\Providers;

use App\Models\Conversation;
use App\Models\Listing;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        Route::model('listing', Listing::class);
        Route::model('order', Order::class);
        Route::model('conversation', Conversation::class);
        Route::model('user', User::class);
    }
}
