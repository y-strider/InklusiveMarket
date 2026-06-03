@extends('layouts.app')
@section('content')
<h1 id="edit-category-title">Edit Category</h1>
<form method="post" action="{{ route('admin.categories.update', $category) }}" aria-label="Edit Category Form">
    @csrf
    @method('PUT')
    <div>
        <label for="name">Name</label>
        <input id="name" name="name" type="text" value="{{ old('name', $category->name) }}" required>
    </div>
    <div>
        <label for="description">Description</label>
        <input id="description" name="description" type="text" value="{{ old('description', $category->description) }}">
    </div>
    <div>
        <label for="status">Status</label>
        <select id="status" name="status">
            <option value="1" @if($category->status) selected @endif>Active</option>
            <option value="0" @if(!$category->status) selected @endif>Inactive</option>
        </select>
    </div>
    <button type="submit">Save Changes</button>
</form>
@endsection