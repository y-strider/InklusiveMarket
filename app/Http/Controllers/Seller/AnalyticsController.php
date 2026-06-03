<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $seller = $user->seller;
        $products = $seller ? $seller->products : collect();

        $analytics = [
            'total_products' => $products->count(),
            'total_orders' => $products->sum(function($product) { return $product->orders->count(); }),
            'total_sales' => $products->sum(function($product) { return $product->orders->sum('amount'); }),
            'total_views' => $products->sum('views'),
            'products' => $products->map(function($product) {
                return [
                    'name' => $product->name,
                    'views' => $product->views,
                    'orders' => $product->orders->count(),
                    'sales' => $product->orders->sum('amount'),
                ];
            }),
        ];

        return view('seller.analytics.index', compact('analytics'));
    }
}