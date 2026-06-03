@extends('layouts.app')
@section('content')
<h1 id="admin-users-title">User Management</h1>
@if($users->isEmpty())
    <p>No users found.</p>
@else
    <table role="table" aria-label="User List">
        <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
        @foreach($users as $user)
            <tr>
                <td>{{ $user->name }}</td>
                <td>{{ $user->email }}</td>
                <td>{{ ucfirst($user->role) }}</td>
                <td>{{ $user->status ? 'Active' : 'Inactive' }}</td>
                <td>
                    <a href="{{ route('admin.users.edit', $user) }}">Edit</a>
                    <form method="post" action="{{ route('admin.users.destroy', $user) }}" style="display:inline;" aria-label="Delete User">
                        @csrf
                        @method('DELETE')
                        <button type="submit" onclick="return confirm('Delete?')">Delete</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $users->links() }}
@endif
@endsection