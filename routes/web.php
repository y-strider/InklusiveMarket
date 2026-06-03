<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\SearchController;

Route::middleware(['web'])->group(function () {
    Route::get('/', [SearchController::class, 'home'])->name('home');
    Route::get('/search', [SearchController::class, 'index'])->name('search.index');

    Route::middleware(['auth'])->group(function () {
        // Listings
        Route::get('/listings/create', [ListingController::class, 'create'])->name('listings.create');
        Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
        Route::get('/listings/{listing}/edit', [ListingController::class, 'edit'])->name('listings.edit');
        Route::put('/listings/{listing}', [ListingController::class, 'update'])->name('listings.update');
        Route::delete('/listings/{listing}', [ListingController::class, 'destroy'])->name('listings.destroy');
        Route::post('/listings/{listing}/publish', [ListingController::class, 'publish'])->name('listings.publish');
        Route::post('/listings/{listing}/unpublish', [ListingController::class, 'unpublish'])->name('listings.unpublish');
        Route::post('/listings/{listing}/images', [ListingController::class, 'uploadImage'])->name('listings.images.upload');
        Route::delete('/listings/{listing}/images/{image}', [ListingController::class, 'removeImage'])->name('listings.images.remove');
        Route::post('/listings/{listing}/favorite', [FavoriteController::class, 'toggle'])->name('listings.favorite.toggle');

        // Orders
        Route::post('/listings/{listing}/checkout', [OrderController::class, 'checkout'])->name('orders.checkout');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('/orders/{order}/pay', [OrderController::class, 'pay'])->name('orders.pay');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('/orders/{order}/ship', [OrderController::class, 'ship'])->name('orders.ship');
        Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])->name('orders.complete');

        // Messaging
        Route::get('/inbox', [MessageController::class, 'inbox'])->name('messages.inbox');
        Route::get('/threads/{thread}', [MessageController::class, 'show'])->name('messages.thread');
        Route::post('/threads/{thread}/messages', [MessageController::class, 'send'])->name('messages.send');
        Route::post('/listings/{listing}/message', [MessageController::class, 'startFromListing'])->name('messages.start');

        // Reviews
        Route::post('/orders/{order}/review', [ReviewController::class, 'store'])->name('reviews.store');
        Route::get('/users/{user}/reviews', [ReviewController::class, 'index'])->name('reviews.index');

        // Dashboards
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
        Route::get('/dashboard/sales', [DashboardController::class, 'sales'])->name('dashboard.sales');
        Route::get('/dashboard/purchases', [DashboardController::class, 'purchases'])->name('dashboard.purchases');
        Route::get('/dashboard/favorites', [DashboardController::class, 'favorites'])->name('dashboard.favorites');
        Route::get('/dashboard/analytics', [DashboardController::class, 'analytics'])->name('dashboard.analytics');
    });

    // Public listing pages
    Route::get('/listings', [ListingController::class, 'index'])->name('listings.index');
    Route::get('/listings/{listing}', [ListingController::class, 'show'])->name('listings.show');

    // Admin moderation
    Route::middleware(['auth', 'can:moderate'])->group(function () {
        Route::get('/admin/moderation', [ModerationController::class, 'index'])->name('admin.moderation.index');
        Route::post('/admin/moderation/listings/{listing}/approve', [ModerationController::class, 'approve'])->name('admin.moderation.listings.approve');
        Route::post('/admin/moderation/listings/{listing}/reject', [ModerationController::class, 'reject'])->name('admin.moderation.listings.reject');
        Route::post('/admin/moderation/reviews/{review}/remove', [ModerationController::class, 'removeReview'])->name('admin.moderation.reviews.remove');
        Route::post('/admin/moderation/users/{user}/suspend', [ModerationController::class, 'suspendUser'])->name('admin.moderation.users.suspend');
    });
});
