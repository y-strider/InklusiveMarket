<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $seller = auth()->user()->seller;
        $products = \App\Models\Product::where('seller_id',$seller->id)->latest()->paginate(12);
        return view('seller.products.index', compact('products'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = \App\Models\Category::where('active',true)->get();
        return view('seller.products.create', compact('categories'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'=>'required|max:150',
            'price'=>'required|numeric|min:0',
            'stock'=>'required|integer|min:0',
            'category_id'=>'nullable|exists:categories,id',
            'images.*'=>'image|max:2048',
        ]);
        $product = \App\Models\Product::create([
            'seller_id' => auth()->user()->seller->id,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'approval_status' => 'pending',
        ]);
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $img) {
                $path = $img->store('products','public');
                $product->images()->create(['path'=>$path,'is_primary'=>$i===0]);
            }
        }
        return redirect()->route('seller.products.index')->with('ok','Submitted for approval.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $this->authorize('update', $product);
        $categories = \App\Models\Category::where('active',true)->get();
        return view('seller.products.edit', compact('product','categories'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $this->authorize('update', $product);
        $categories = \App\Models\Category::where('active',true)->get();
        return view('seller.products.edit', compact('product','categories'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $this->authorize('update', $product);
        $request->validate([
            'name'=>'required|max:150',
            'price'=>'required|numeric|min:0',
            'stock'=>'required|integer|min:0',
            'category_id'=>'nullable|exists:categories,id',
            'images.*'=>'image|max:2048',
        ]);
        $product->update($request->only('name','description','price','stock','category_id'));
        $product->update(['approval_status'=>'pending']);
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $img) {
                $path = $img->store('products','public');
                $product->images()->create(['path'=>$path,'is_primary'=>false]);
            }
        }
        return back()->with('ok','Updated and sent for re-approval.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $this->authorize('delete', $product);
        $product->delete();
        return back()->with('ok','Deleted.');
    }
}
