@extends('layouts.app')
@section('content')
<h1 id="orders-title">Your Orders</h1>
@if($orders->isEmpty())
    <p>No orders yet.</p>
@else
    <table role="table" aria-label="Order History">
        <thead>
            <tr>
                <th scope="col">Reference</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Items</th>
            </tr>
        </thead>
        <tbody>
        @foreach($orders as $order)
            <tr>
                <td>{{ $order->reference }}</td>
                <td>{{ $order->total }}</td>
                <td>{{ $order->status }}</td>
                <td>
                    <ul aria-label="Order Items">
                        @foreach($order->items as $item)
                            <li>{{ $item->product->name }} x {{ $item->quantity }}</li>
                        @endforeach
                    </ul>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $orders->links() }}
@endif
@endsection
