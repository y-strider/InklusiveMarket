@extends('layouts.app')
@section('content')
<h1 id="inventory-title">Inventory Monitoring</h1>
@if($inventory->isEmpty())
    <p>No inventory records found.</p>
@else
    <table role="table" aria-label="Inventory List">
        <thead>
            <tr>
                <th scope="col">Product</th>
                <th scope="col">Stock</th>
                <th scope="col">Reserved</th>
                <th scope="col">Low Stock Threshold</th>
                <th scope="col">Last Updated</th>
            </tr>
        </thead>
        <tbody>
        @foreach($inventory as $item)
            <tr>
                <td>{{ $item->product->name ?? '' }}</td>
                <td>{{ $item->currentstock }}</td>
                <td>{{ $item->reservedstock }}</td>
                <td>{{ $item->lowstockthreshold }}</td>
                <td>{{ $item->lastupdated }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $inventory->links() }}
@endif
@endsection