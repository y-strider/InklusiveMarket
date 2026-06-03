@extends('layouts.app')
@section('content')
<h1 id="create-category-title">Add Category</h1>
<form method="post" action="{{ route('admin.categories.store') }}" aria-label="Add Category Form">
    @csrf
    <div>
        <label for="name">Name</label>
        <input id="name" name="name" type="text" required>
    </div>
    <div>
        <label for="description">Description</label>
        <input id="description" name="description" type="text">
    </div>
    <div>
        <label for="status">Status</label>
        <select id="status" name="status">
            <option value="1">Active</option>
            <option value="0">Inactive</option>
        </select>
    </div>
    <button type="submit">Save Category</button>
</form>
@endsection