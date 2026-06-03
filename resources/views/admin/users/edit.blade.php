@extends('layouts.app')
@section('content')
<h1 id="edit-user-title">Edit User</h1>
<form method="post" action="{{ route('admin.users.update', $user) }}" aria-label="Edit User Form">
    @csrf
    @method('PUT')
    <div>
        <label for="name">Name</label>
        <input id="name" name="name" type="text" value="{{ old('name', $user->name) }}" required>
    </div>
    <div>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" value="{{ old('email', $user->email) }}" required>
    </div>
    <div>
        <label for="role">Role</label>
        <select id="role" name="role">
            <option value="buyer" @if($user->role === 'buyer') selected @endif>Buyer</option>
            <option value="seller" @if($user->role === 'seller') selected @endif>Seller</option>
            <option value="admin" @if($user->role === 'admin') selected @endif>Admin</option>
        </select>
    </div>
    <div>
        <label for="status">Status</label>
        <select id="status" name="status">
            <option value="1" @if($user->status) selected @endif>Active</option>
            <option value="0" @if(!$user->status) selected @endif>Inactive</option>
        </select>
    </div>
    <button type="submit">Save Changes</button>
</form>
@endsection