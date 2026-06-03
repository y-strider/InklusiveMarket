@extends('layouts.app')
@section('content')
<h1 id="cart-title">Your Cart</h1>
@if(empty($cart))
    <p>Your cart is empty.</p>
@else
    <table role="table" aria-label="Shopping Cart">
        <thead>
            <tr>
                <th scope="col">Product</th>
                <th scope="col">Qty</th>
                <th scope="col">Price</th>
                <th scope="col">Subtotal</th>
            </tr>
        </thead>
        <tbody>
        @foreach($cart as $id => $item)
            <tr>
                <td>{{ $item['name'] }}</td>
                <td>{{ $item['qty'] }}</td>
                <td>{{ $item['price'] }}</td>
                <td>{{ $item['qty'] * $item['price'] }}</td>
            </tr>
        @endforeach
        <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>{{ $total }}</strong></td>
        </tr>
        </tbody>
    </table>
    <form method="post" action="{{ route('checkout.intent') }}" aria-label="Checkout Form">
        @csrf
        <button type="submit">Checkout</button>
    </form>
@endif
@endsection
