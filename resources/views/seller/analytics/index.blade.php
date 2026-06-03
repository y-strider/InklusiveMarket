@extends('layouts.app')
@section('content')
<h1 id="seller-analytics-title">Seller Analytics</h1>
@if(empty($analytics))
    <p>No analytics data available.</p>
@else
    <div role="region" aria-label="Seller Analytics Summary">
        <ul>
            <li>Total Products: {{ $analytics['total_products'] ?? 0 }}</li>
            <li>Total Orders: {{ $analytics['total_orders'] ?? 0 }}</li>
            <li>Total Sales: {{ $analytics['total_sales'] ?? 0 }}</li>
            <li>Total Views: {{ $analytics['total_views'] ?? 0 }}</li>
        </ul>
    </div>
    <table role="table" aria-label="Product Analytics">
        <thead>
            <tr>
                <th scope="col">Product</th>
                <th scope="col">Views</th>
                <th scope="col">Orders</th>
                <th scope="col">Sales</th>
            </tr>
        </thead>
        <tbody>
        @foreach($analytics['products'] ?? [] as $product)
            <tr>
                <td>{{ $product['name'] }}</td>
                <td>{{ $product['views'] }}</td>
                <td>{{ $product['orders'] }}</td>
                <td>{{ $product['sales'] }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
@endif
@endsection