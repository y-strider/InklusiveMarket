<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    $userCount = \App\Models\User::count();
    $recentUsers = \App\Models\User::latest()->take(5)->get();
    $productCount = \App\Models\Product::count();
    $recentProducts = \App\Models\Product::latest()->take(5)->get();
    $orderCount = \App\Models\Order::count();
    $recentOrders = \App\Models\Order::latest()->take(5)->get();
    $categoryCount = \App\Models\Category::count();
    $recentCategories = \App\Models\Category::latest()->take(5)->get();
    $inventoryCount = \App\Models\Inventory::count();
    $recentInventory = \App\Models\Inventory::latest()->take(5)->get();
    return view('dashboard', compact('userCount', 'recentUsers', 'productCount', 'recentProducts', 'orderCount', 'recentOrders', 'categoryCount', 'recentCategories', 'inventoryCount', 'recentInventory'));
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Cart
    Route::post('/cart/add/{product}', [\App\Http\Controllers\CartController::class, 'add'])->name('cart.add');
    Route::get('/cart', [\App\Http\Controllers\CartController::class, 'view'])->name('cart.view');

    // Catalog
    Route::get('/catalog', [\App\Http\Controllers\CatalogController::class, 'index'])->name('catalog.index');
    Route::get('/catalog/{slug}', [\App\Http\Controllers\CatalogController::class, 'show'])->name('catalog.show');

    // Checkout
    Route::post('/checkout/create-intent', [\App\Http\Controllers\CheckoutController::class, 'createIntent'])->name('checkout.createIntent');
    Route::post('/checkout/confirm', [\App\Http\Controllers\CheckoutController::class, 'confirm'])->name('checkout.confirm');
    Route::get('/orders', [\App\Http\Controllers\CheckoutController::class, 'orders'])->name('orders.index');

    // Order Review
    Route::get('/orders/{order}/review', [\App\Http\Controllers\OrderReviewController::class, 'create'])->name('orders.review.create');
    Route::post('/orders/{order}/review', [\App\Http\Controllers\OrderReviewController::class, 'store'])->name('orders.review.submit');
});

/**
 * Admin routes (requires 'admin' role)
 */
Route::middleware(['auth', 'can:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('dashboard');

    // Users
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class);

    // Categories
    Route::resource('categories', \App\Http\Controllers\Admin\CategoryController::class);

    // Inventory
    Route::get('inventory', [\App\Http\Controllers\Admin\InventoryController::class, 'index'])->name('inventory.index');

    // Product Approval
    Route::get('products/pending', [\App\Http\Controllers\Admin\ProductApprovalController::class, 'index'])->name('products.pending');
    Route::post('products/{id}/approve', [\App\Http\Controllers\Admin\ProductApprovalController::class, 'approve'])->name('products.approve');
    Route::post('products/{id}/reject', [\App\Http\Controllers\Admin\ProductApprovalController::class, 'reject'])->name('products.reject');

    // Featured Products
    Route::get('products/featured', [\App\Http\Controllers\Admin\ProductFeaturedController::class, 'index'])->name('products.featured');
    Route::post('products/{product}/feature', [\App\Http\Controllers\Admin\ProductFeaturedController::class, 'feature'])->name('products.feature');
    Route::post('products/{product}/unfeature', [\App\Http\Controllers\Admin\ProductFeaturedController::class, 'unfeature'])->name('products.unfeature');

    // Reports
    Route::get('reports/transactions', [\App\Http\Controllers\Admin\ReportController::class, 'transactions'])->name('reports.transactions');
    Route::get('reports/sales', [\App\Http\Controllers\Admin\ReportController::class, 'sales'])->name('reports.sales');
});

/**
 * Seller routes (requires 'seller' role)
 */
Route::middleware(['auth', 'can:seller'])->prefix('seller')->name('seller.')->group(function () {
    // Products
    Route::resource('products', \App\Http\Controllers\Seller\ProductController::class);

    // Analytics
    Route::get('analytics', [\App\Http\Controllers\Seller\AnalyticsController::class, 'index'])->name('analytics.index');
});

require __DIR__.'/auth.php';
