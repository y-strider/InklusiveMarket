@extends('layouts.app')
@section('content')
<h1 id="categories-title">Manage Categories</h1>
<a href="{{ route('admin.categories.create') }}">Add Category</a>
@if($categories->isEmpty())
    <p>No categories found.</p>
@else
    <table role="table" aria-label="Category List">
        <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
        @foreach($categories as $cat)
            <tr>
                <td>{{ $cat->name }}</td>
                <td>{{ $cat->description }}</td>
                <td>{{ $cat->status ? 'Active' : 'Inactive' }}</td>
                <td>
                    <a href="{{ route('admin.categories.edit', $cat) }}">Edit</a>
                    <form method="post" action="{{ route('admin.categories.destroy', $cat) }}" style="display:inline;" aria-label="Delete Category">
                        @csrf
                        @method('DELETE')
                        <button type="submit" onclick="return confirm('Delete?')">Delete</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $categories->links() }}
@endif
@endsection