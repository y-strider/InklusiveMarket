@extends('layouts.app')
@section('content')
<h1 id="sales-report-title">Sales Reports</h1>
@if($sales->isEmpty())
    <p>No sales data found.</p>
@else
    <table role="table" aria-label="Sales Report">
        <thead>
            <tr>
                <th scope="col">Date</th>
                <th scope="col">Total Orders</th>
                <th scope="col">Total Sales</th>
            </tr>
        </thead>
        <tbody>
        @foreach($sales as $row)
            <tr>
                <td>{{ $row->date }}</td>
                <td>{{ $row->orders }}</td>
                <td>{{ $row->total }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $sales->links() }}
@endif
@endsection