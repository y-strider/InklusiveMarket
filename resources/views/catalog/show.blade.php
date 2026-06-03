@extends('layouts.app')
@section('content')
<h1 id="product-title">{{ $product->name }}</h1>
<p aria-label="Product Description">{{ $product->description }}</p>
<p><span aria-label="Price">Price:</span> {{ $product->price }}</p>
<p><span aria-label="Stock">Stock:</span> {{ $product->stock }}</p>
@if($product->images->count())
    <div role="region" aria-label="Product Images">
        @foreach($product->images as $img)
            <img src="{{ asset('storage/'.$img->path) }}" alt="Image of {{ $product->name }}" style="max-width:120px;">
        @endforeach
    </div>
@endif
<form method="post" action="{{ route('cart.add', $product) }}" aria-label="Add to Cart">
    @csrf
    <label for="qty">Quantity</label>
    <input id="qty" type="number" name="qty" value="1" min="1" max="{{ $product->stock }}">
    <button type="submit">Add to Cart</button>
</form>
@endsection
