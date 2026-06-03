<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function createIntent(Request $r)
    {
        $user = $r->user();
        $cart = session('cart', []);
        abort_if(empty($cart), 400, 'Cart is empty');

        $amount = (int) round(collect($cart)->sum(fn($i)=>$i['price'] * $i['qty']) * 100); // cents

        // Simulate PayMongo intent (stub)
        $pi = [
            'id' => uniqid('pi_'),
            'attributes' => [
                'client_key' => 'test_client_key',
                'status' => 'succeeded'
            ]
        ];
        session()->put('pi', $pi);

        return response()->json(['client_key' => $pi['attributes']['client_key'] ?? null]);
    }

    public function confirm(Request $r)
    {
        $user = $r->user();
        $cart = session('cart', []);
        $pi = session('pi');
        abort_if(empty($cart) || empty($pi), 400);

        // Simulate payment status check (stub)
        $status = $pi['attributes']['status'] ?? 'succeeded';

        if ($status !== 'succeeded' && $status !== 'paid') {
            return back()->withErrors(['payment' => 'Payment not completed.']);
        }

        // Create order
        \DB::transaction(function() use ($user, $cart, $pi, $status) {
            $total = collect($cart)->sum(fn($i)=>$i['price'] * $i['qty']);
            $order = \App\Models\Order::create([
                'buyer_id' => $user->id,
                'reference' => strtoupper(\Str::random(10)),
                'total' => $total,
                'delivery_address' => $user->address ?? 'To be arranged',
                'status' => 'confirmed',
            ]);

            foreach ($cart as $pid => $line) {
                $product = \App\Models\Product::lockForUpdate()->findOrFail($pid);
                $qty = min($line['qty'], $product->stock);
                \App\Models\OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => $product->price,
                    'subtotal' => $product->price * $qty,
                ]);
                $product->decrement('stock', $qty);
            }

            \App\Models\Payment::create([
                'order_id' => $order->id,
                'provider' => 'paymongo',
                'payment_id' => $pi['id'],
                'method' => 'unknown',
                'amount' => $total,
                'status' => 'paid',
                'raw' => json_encode($pi),
            ]);
        });

        session()->forget(['cart','pi']);
        return redirect()->route('orders.index')->with('ok','Order placed!');
    }

    public function orders(Request $r)
    {
        $orders = $r->user()->orders()->latest()->with('items.product','payment')->paginate(10);
        return view('orders.index', compact('orders'));
    }
}
