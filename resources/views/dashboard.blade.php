<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
<div class="p-6 text-gray-900">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- User Count Card -->
        <div class="bg-blue-100 rounded-lg p-4 flex flex-col items-center">
            <div class="text-3xl font-bold text-blue-700">{{ $userCount }}</div>
            <div class="text-sm text-blue-800">Total Users</div>
            <a href="{{ route('admin.users.index') }}" class="mt-2 text-blue-600 underline text-xs">Manage Users</a>
        </div>
        <!-- Product Count Card -->
        <div class="bg-green-100 rounded-lg p-4 flex flex-col items-center">
            <div class="text-3xl font-bold text-green-700">{{ $productCount }}</div>
            <div class="text-sm text-green-800">Total Products</div>
            <a href="{{ route('admin.categories.index') }}" class="mt-2 text-green-600 underline text-xs">Manage Products</a>
        </div>
        <!-- Order Count Card -->
        <div class="bg-yellow-100 rounded-lg p-4 flex flex-col items-center">
            <div class="text-3xl font-bold text-yellow-700">{{ $orderCount }}</div>
            <div class="text-sm text-yellow-800">Total Orders</div>
            <a href="{{ route('orders.index') }}" class="mt-2 text-yellow-600 underline text-xs">View Orders</a>
        </div>
        <!-- Category Count Card -->
        <div class="bg-purple-100 rounded-lg p-4 flex flex-col items-center">
            <div class="text-3xl font-bold text-purple-700">{{ $categoryCount }}</div>
            <div class="text-sm text-purple-800">Total Categories</div>
            <a href="{{ route('admin.categories.index') }}" class="mt-2 text-purple-600 underline text-xs">Manage Categories</a>
        </div>
        <!-- Inventory Count Card -->
        <div class="bg-orange-100 rounded-lg p-4 flex flex-col items-center">
            <div class="text-3xl font-bold text-orange-700">{{ $inventoryCount }}</div>
            <div class="text-sm text-orange-800">Total Inventory Records</div>
            <a href="{{ route('admin.inventory.index') }}" class="mt-2 text-orange-600 underline text-xs">Manage Inventory</a>
        </div>
        <!-- Add more cards here for other modules -->
    </div>
    <!-- Recent Inventory Widget -->
    <div class="mb-4">
        <div class="font-semibold mb-2">Recent Inventory</div>
        <ul class="list-disc pl-5">
            @foreach($recentInventory as $inv)
                <li>
                    Product #{{ $inv->product_id ?? 'N/A' }}: {{ $inv->currentstock ?? 'N/A' }} in stock
                    <span class="text-xs text-gray-500">({{ $inv->created_at->diffForHumans() }})</span>
                </li>
            @endforeach
        </ul>
    </div>
    <!-- Recent Categories Widget -->
    <div class="mb-4">
        <div class="font-semibold mb-2">Recent Categories</div>
        <ul class="list-disc pl-5">
            @foreach($recentCategories as $category)
                <li>{{ $category->name ?? 'Unnamed Category' }} <span class="text-xs text-gray-500">({{ $category->created_at->diffForHumans() }})</span></li>
            @endforeach
        </ul>
    </div>
    <!-- Recent Orders Widget -->
    <div class="mb-4">
        <div class="font-semibold mb-2">Recent Orders</div>
        <ul class="list-disc pl-5">
            @foreach($recentOrders as $order)
                <li>Order #{{ $order->id }} <span class="text-xs text-gray-500">({{ $order->created_at->diffForHumans() }})</span></li>
            @endforeach
        </ul>
    </div>
    <!-- Recent Products Widget -->
    <div class="mb-4">
        <div class="font-semibold mb-2">Recent Products</div>
        <ul class="list-disc pl-5">
            @foreach($recentProducts as $product)
                <li>{{ $product->name ?? 'Unnamed Product' }} <span class="text-xs text-gray-500">({{ $product->created_at->diffForHumans() }})</span></li>
            @endforeach
        </ul>
    </div>
    <!-- Recent Users Widget -->
    <div class="mb-4">
        <div class="font-semibold mb-2">Recent Users</div>
        <ul class="list-disc pl-5">
            @foreach($recentUsers as $user)
                <li>{{ $user->name ?? $user->email }} <span class="text-xs text-gray-500">({{ $user->created_at->diffForHumans() }})</span></li>
            @endforeach
        </ul>
    </div>
    {{ __("You're logged in!") }}
</div>
                </div>
            </div>
        </div>
</x-app-layout>
