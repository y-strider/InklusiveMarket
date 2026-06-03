@extends('layouts.app')
@section('content')
<h1>InklusiveMarket</h1>
<h2>Featured Products</h2>
<div>
    @foreach($featured as $product)
        <div>
            <a href="{{ route('product.show', $product->slug) }}">{{ $product->name }}</a>
            <span>{{ $product->price }}</span>
        </div>
    @endforeach
</div>
<h2>Categories</h2>
<ul>
    @foreach($categories as $cat)
        <li>{{ $cat->name }}</li>
    @endforeach
</ul>
@endsection