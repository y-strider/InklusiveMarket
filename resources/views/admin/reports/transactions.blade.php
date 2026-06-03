@extends('layouts.app')
@section('content')
<h1 id="transactions-report-title">Transaction Reports</h1>
@if($transactions->isEmpty())
    <p>No transactions found.</p>
@else
    <table role="table" aria-label="Transaction Report">
        <thead>
            <tr>
                <th scope="col">Reference</th>
                <th scope="col">Buyer</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
            </tr>
        </thead>
        <tbody>
        @foreach($transactions as $txn)
            <tr>
                <td>{{ $txn->reference }}</td>
                <td>{{ $txn->buyer->name ?? '' }}</td>
                <td>{{ $txn->amount }}</td>
                <td>{{ $txn->status }}</td>
                <td>{{ $txn->created_at }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $transactions->links() }}
@endif
@endsection