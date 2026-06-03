<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function home()
    {
        $featured = \App\Models\Product::where('approval_status','approved')->where('is_featured',true)->latest()->take(8)->with('images')->get();
        $categories = \App\Models\Category::where('active',true)->get();
        return view('home', compact('featured','categories'));
    }

    public function index(Request $r)
    {
        $q = \App\Models\Product::where('approval_status','approved')->with('images','category');
        if ($r->filled('category')) {
            $q->whereHas('category', fn($w) => $w->where('slug', $r->category));
        }
        if ($r->filled('search')) {
            $s = $r->search;
            $q->where(fn($w) => $w->where('name','like',"%$s%")->orWhere('description','like',"%$s%"));
        }
        $products = $q->paginate(12)->withQueryString();
        $categories = \App\Models\Category::where('active',true)->get();
        return view('catalog.index', compact('products','categories'));
    }

    public function show(string $slug)
    {
        $product = \App\Models\Product::where('slug',$slug)->where('approval_status','approved')->with('images','seller.user','category')->firstOrFail();
        return view('catalog.show', compact('product'));
    }
}
