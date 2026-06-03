<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductFeaturedController extends Controller
{
    public function index()
    {
        $products = Product::with(['seller.user', 'category'])->paginate(20);
        return view('admin.products.featured', compact('products'));
    }

    public function feature(Product $product)
    {
        $product->isfeatured = true;
        $product->save();
        return redirect()->route('admin.products.featured')->with('success', 'Product featured.');
    }

    public function unfeature(Product $product)
    {
        $product->isfeatured = false;
        $product->save();
        return redirect()->route('admin.products.featured')->with('success', 'Product unfeatured.');
    }
}