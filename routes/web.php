<?php

use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/', fn() => view('pages.home'))->name('home');
Route::get('/browse', fn() => view('pages.browse'))->name('browse');
Route::get('/browse/{category:slug}', fn($category) => view('pages.browse', compact('category')))->name('browse.category');
Route::get('/listings/{listing:slug}', fn($listing) => view('pages.listing', compact('listing')))->name('listings.show');
Route::get('/sellers/{user:username}', fn($user) => view('pages.seller', compact('user')))->name('sellers.show');
Route::get('/search', fn() => view('pages.search'))->name('search');
Route::get('/pages/{slug}', fn($slug) => view('pages.static', compact('slug')))->name('pages.show');

// Auth (Breeze handles /login, /register, /password/*, /email/verify/*)

// Buyer routes
Route::middleware(['auth', 'suspended'])->group(function () {
    Route::get('/dashboard', fn() => view('buyer.dashboard'))->name('dashboard');
    Route::get('/orders', fn() => view('buyer.orders.index'))->name('orders.index');
    Route::get('/orders/{order:ulid}', fn($order) => view('buyer.orders.show', compact('order')))->name('orders.show');
    Route::get('/checkout/{listing:slug}', fn($listing) => view('buyer.checkout', compact('listing')))->name('checkout');
    Route::get('/favorites', fn() => view('buyer.favorites'))->name('favorites');
    Route::get('/messages', fn() => view('buyer.messages.index'))->name('messages.index');
    Route::get('/messages/{conversation:ulid}', fn($conversation) => view('buyer.messages.show', compact('conversation')))->name('messages.show');
    Route::get('/reviews', fn() => view('buyer.reviews'))->name('reviews.index');
    Route::get('/settings', fn() => view('buyer.settings.profile'))->name('settings');
    Route::get('/settings/profile', fn() => view('buyer.settings.profile'))->name('settings.profile');
    Route::get('/settings/account', fn() => view('buyer.settings.account'))->name('settings.account');
    Route::get('/settings/notifications', fn() => view('buyer.settings.notifications'))->name('settings.notifications');
});

// Seller routes
Route::middleware(['auth', 'suspended', 'seller'])->prefix('seller')->name('seller.')->group(function () {
    Route::get('/dashboard', fn() => view('seller.dashboard'))->name('dashboard');
    Route::get('/listings', fn() => view('seller.listings.index'))->name('listings.index');
    Route::get('/listings/create', fn() => view('seller.listings.create'))->name('listings.create');
    Route::get('/listings/{listing:ulid}', fn($listing) => view('seller.listings.edit', compact('listing')))->name('listings.edit');
    Route::get('/orders', fn() => view('seller.orders.index'))->name('orders.index');
    Route::get('/orders/{order:ulid}', fn($order) => view('seller.orders.show', compact('order')))->name('orders.show');
    Route::get('/offers', fn() => view('seller.offers'))->name('offers');
    Route::get('/reviews', fn() => view('seller.reviews'))->name('reviews');
    Route::get('/payouts', fn() => view('seller.payouts'))->name('payouts');
    Route::get('/shipping', fn() => view('seller.shipping'))->name('shipping');
    Route::get('/analytics', fn() => view('seller.analytics'))->name('analytics');
    Route::get('/settings', fn() => view('seller.settings'))->name('settings');
    Route::get('/onboarding/return', fn() => view('seller.onboarding-return'))->name('onboarding.return');
});

// Admin routes
Route::middleware(['auth', 'suspended', 'permission:analytics.view'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn() => view('admin.dashboard'))->name('dashboard');
    Route::get('/users', fn() => view('admin.users.index'))->name('users.index');
    Route::get('/users/{user:ulid}', fn($user) => view('admin.users.show', compact('user')))->name('users.show');
    Route::get('/listings', fn() => view('admin.listings.index'))->name('listings.index');
    Route::get('/listings/{listing:ulid}', fn($listing) => view('admin.listings.show', compact('listing')))->name('listings.show');
    Route::get('/orders', fn() => view('admin.orders.index'))->name('orders.index');
    Route::get('/orders/{order:ulid}', fn($order) => view('admin.orders.show', compact('order')))->name('orders.show');
    Route::get('/reports', fn() => view('admin.reports.index'))->name('reports.index');
    Route::get('/reports/{report:ulid}', fn($report) => view('admin.reports.show', compact('report')))->name('reports.show');
    Route::get('/disputes', fn() => view('admin.disputes.index'))->name('disputes.index');
    Route::get('/disputes/{dispute:ulid}', fn($dispute) => view('admin.disputes.show', compact('dispute')))->name('disputes.show');
    Route::get('/reviews', fn() => view('admin.reviews.index'))->name('reviews.index');
    Route::get('/coupons', fn() => view('admin.coupons.index'))->name('coupons.index');
    Route::get('/announcements', fn() => view('admin.announcements.index'))->name('announcements.index');
    Route::get('/payouts', fn() => view('admin.payouts.index'))->name('payouts.index');
    Route::get('/analytics', fn() => view('admin.analytics'))->name('analytics');
    Route::get('/settings', fn() => view('admin.settings'))->name('settings');
    Route::get('/activity', fn() => view('admin.activity'))->name('activity');
});

// Stripe webhook
Route::post('/stripe/webhook', [\App\Http\Controllers\StripeWebhookController::class, 'handle'])
    ->name('stripe.webhook')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
