<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CartController extends Controller
{
    public function add(Request $r, \App\Models\Product $product)
    {
        abort_if($product->approval_status !== 'approved', 404);
        $qty = max(1, (int)$r->input('qty', 1));
        $cart = session()->get('cart', []);
        $line = $cart[$product->id] ?? ['name'=>$product->name,'price'=>$product->price,'qty'=>0];
        $line['qty'] = min($product->stock, $line['qty'] + $qty);
        $cart[$product->id] = $line;
        session()->put('cart', $cart);
        return redirect()->route('cart.view');
    }

    public function view()
    {
        $cart = session('cart', []);
        $total = collect($cart)->sum(fn($i) => $i['price'] * $i['qty']);
        return view('cart.view', compact('cart','total'));
    }
}
