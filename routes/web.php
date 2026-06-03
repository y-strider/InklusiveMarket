<?php

use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\ListingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OfferController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/listings', [ListingController::class, 'index'])->name('listings.index');
    Route::get('/listings/{ulid}', [ListingController::class, 'show'])->name('listings.show');
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{slug}', [CategoryController::class, 'show'])->name('categories.show');

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/me', [ProfileController::class, 'me'])->name('profile.me');
        Route::patch('/me', [ProfileController::class, 'update'])->name('profile.update');

        Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
        Route::put('/listings/{ulid}', [ListingController::class, 'update'])->name('listings.update');
        Route::delete('/listings/{ulid}', [ListingController::class, 'destroy'])->name('listings.destroy');

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{ulid}', [OrderController::class, 'show'])->name('orders.show');
        Route::patch('/orders/{ulid}/status', [OrderController::class, 'updateStatus'])->name('orders.status');

        Route::get('/offers', [OfferController::class, 'index'])->name('offers.index');
        Route::post('/offers', [OfferController::class, 'store'])->name('offers.store');
        Route::patch('/offers/{ulid}/respond', [OfferController::class, 'respond'])->name('offers.respond');

        Route::get('/conversations', [ConversationController::class, 'index'])->name('conversations.index');
        Route::post('/conversations', [ConversationController::class, 'store'])->name('conversations.store');
        Route::get('/conversations/{ulid}', [ConversationController::class, 'show'])->name('conversations.show');
        Route::post('/conversations/{ulid}/messages', [ConversationController::class, 'sendMessage'])->name('conversations.messages.store');

        Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index');
        Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store');
        Route::post('/reviews/{ulid}/reply', [ReviewController::class, 'reply'])->name('reviews.reply');

        Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::post('/favorites', [FavoriteController::class, 'toggle'])->name('favorites.toggle');

        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');

        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    });
});
