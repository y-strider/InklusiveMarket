@extends('layouts.app')
@section('content')
<h1 id="featured-products-title">Manage Featured Products</h1>
@if($products->isEmpty())
    <p>No products available for featuring.</p>
@else
    <table role="table" aria-label="Featured Products Management">
        <thead>
            <tr>
                <th scope="col">Product</th>
                <th scope="col">Seller</th>
                <th scope="col">Category</th>
                <th scope="col">Featured</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
        @foreach($products as $product)
            <tr>
                <td>{{ $product->name }}</td>
                <td>{{ $product->seller->user->name ?? '' }}</td>
                <td>{{ $product->category->name ?? '' }}</td>
                <td>{{ $product->isfeatured ? 'Yes' : 'No' }}</td>
                <td>
                    @if(!$product->isfeatured)
                    <form method="post" action="{{ route('admin.products.feature', $product) }}" style="display:inline;" aria-label="Feature Product">
                        @csrf
                        <button type="submit">Feature</button>
                    </form>
                    @else
                    <form method="post" action="{{ route('admin.products.unfeature', $product) }}" style="display:inline;" aria-label="Unfeature Product">
                        @csrf
                        <button type="submit">Unfeature</button>
                    </form>
                    @endif
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $products->links() }}
@endif
@endsection