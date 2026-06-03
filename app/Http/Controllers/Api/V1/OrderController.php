<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $request->input('role', 'buyer');
        $orders = ($role === 'seller')
            ? Order::forSeller($user->id)
            : Order::forBuyer($user->id);
        $orders = $orders->with(['listing:id,ulid,title,slug', 'buyer:id,username,displayname', 'seller:id,username,displayname'])
            ->when($request->string('status')->toString(), fn($q, $v) => $q->where('status', $v))
            ->orderBy('createdat', 'desc')
            ->paginate(20);
        return response()->json($orders);
    }

    public function show(string $ulid): JsonResponse
    {
        $order = Order::where('ulid', $ulid)
            ->with(['listing','buyer','seller','statusLogs.changer','review','dispute','platformFee'])
            ->firstOrFail();
        Gate::authorize('view', $order);
        return response()->json($order);
    }

    public function updateStatus(Request $request, string $ulid): JsonResponse
    {
        $order = Order::where('ulid', $ulid)->firstOrFail();
        $user = $request->user();
        $validated = $request->validate([
            'status' => 'required|in:processing,shipped,delivered,completed,cancelled',
            'trackingnumber' => 'required_if:status,shipped|nullable|string',
            'reason' => 'required_if:status,cancelled|nullable|string',
            'note' => 'nullable|string',
        ]);
        match ($validated['status']) {
            'shipped' => (function () use ($order, $validated, $user) {
                Gate::authorize('ship', $order);
                $this->orderService->markShipped($order, $validated['trackingnumber'], $user->id);
            })(),
            'delivered' => (function () use ($order, $user) {
                Gate::authorize('complete', $order);
                $this->orderService->markDelivered($order, $user->id);
            })(),
            'completed' => (function () use ($order, $user) {
                Gate::authorize('complete', $order);
                $this->orderService->markCompleted($order, $user->id);
            })(),
            'cancelled' => (function () use ($order, $validated, $user) {
                Gate::authorize('cancel', $order);
                $this->orderService->cancel($order, $user->id, $validated['reason'] ?? '');
            })(),
            'processing' => (function () use ($order, $user, $validated) {
                if ($user->id !== $order->sellerid && !$user->isAdmin()) abort(403);
                $order->transitionTo('processing', $user->id, $validated['note'] ?? null);
            })(),
        };
        return response()->json($order->fresh(['statusLogs']));
    }
}
