@extends('layouts.app')
@section('content')
<h1 id="pending-products-title">Pending Product Approvals</h1>
@if($products->isEmpty())
    <p>No pending products.</p>
@else
    <table role="table" aria-label="Pending Product Approvals">
        <thead>
            <tr>
                <th scope="col">Product</th>
                <th scope="col">Seller</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
        @foreach($products as $product)
            <tr>
                <td>{{ $product->name }}</td>
                <td>{{ $product->seller->user->name }}</td>
                <td>{{ $product->category->name }}</td>
                <td>{{ $product->approval_status }}</td>
                <td>
                    <form method="post" action="{{ route('admin.products.approve', $product) }}" style="display:inline;" aria-label="Approve Product">
                        @csrf
                        <button type="submit">Approve</button>
                    </form>
                    <form method="post" action="{{ route('admin.products.reject', $product) }}" style="display:inline;" aria-label="Reject Product">
                        @csrf
                        <button type="submit">Reject</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $products->links() }}
@endif
@endsection