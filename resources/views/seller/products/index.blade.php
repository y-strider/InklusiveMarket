@extends('layouts.app')
@section('content')
<h1 id="seller-products-title">My Products</h1>
<a href="{{ route('seller.products.create') }}">Add Product</a>
<table role="table" aria-label="Seller Product List">
    <thead>
        <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Stock</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody>
    @foreach($products as $product)
        <tr>
            <td>{{ $product->name }}</td>
            <td>{{ $product->approval_status }}</td>
            <td>{{ $product->stock }}</td>
            <td>
                <a href="{{ route('seller.products.edit', $product) }}">Edit</a>
                <form method="post" action="{{ route('seller.products.destroy', $product) }}" style="display:inline;" aria-label="Delete Product">
                    @csrf
                    @method('DELETE')
                    <button type="submit" onclick="return confirm('Delete?')">Delete</button>
                </form>
            </td>
        </tr>
    @endforeach
    </tbody>
</table>
{{ $products->links() }}
@endsection
