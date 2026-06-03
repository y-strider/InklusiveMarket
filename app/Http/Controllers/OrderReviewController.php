<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class OrderReviewController extends Controller
{
    public function create(Order $order)
    {
        $order->load('items.product');
        return view('orders.review', compact('order'));
    }

    public function store(Request $request, Order $order)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);
        Review::create([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
            'order_id' => $order->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);
        return redirect()->route('orders.index')->with('success', 'Review submitted.');
    }
}