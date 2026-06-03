@extends('layouts.app')
@section('content')
<h1 id="admin-dashboard-title">Admin Dashboard</h1>
<ul aria-label="Admin Statistics">
    <li>Pending Products: {{ $pending }}</li>
    <li>Total Users: {{ $users }}</li>
    <li>Total Orders: {{ $orders }}</li>
</ul>
<a href="{{ route('admin.products.pending') }}">Review Pending Products</a>
@endsection
