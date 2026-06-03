<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductApprovalController extends Controller
{
    public function index()
    {
        $products = \App\Models\Product::where('approval_status','pending')->with('seller.user','category')->paginate(15);
        return view('admin.products.pending', compact('products'));
    }

    public function approve($id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $product->update(['approval_status'=>'approved']);
        return back()->with('ok','Product approved.');
    }

    public function reject($id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $product->update(['approval_status'=>'rejected']);
        return back()->with('ok','Product rejected.');
    }
}
