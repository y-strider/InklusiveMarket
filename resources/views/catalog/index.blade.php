@extends('layouts.app')
@section('content')
<h1 id="catalog-title">Catalog</h1>
<form method="get" action="{{ route('catalog.index') }}" aria-label="Product Filter">
    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search products...">
    <select name="category">
        <option value="">All Categories</option>
        @foreach($categories as $cat)
            <option value="{{ $cat->slug }}" @if(request('category')==$cat->slug) selected @endif>{{ $cat->name }}</option>
        @endforeach
    </select>
    <button type="submit">Filter</button>
</form>
<div role="list" aria-label="Product List">
    @foreach($products as $product)
        <div role="listitem" tabindex="0" aria-labelledby="product-{{ $product->id }}">
            <a id="product-{{ $product->id }}" href="{{ route('product.show', $product->slug) }}">{{ $product->name }}</a>
            <span>{{ $product->price }}</span>
        </div>
    @endforeach
</div>
{{ $products->links() }}
@endsection