<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Notifications\ReviewReceived;
use App\Notifications\ReviewReplied;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = Review::published()
            ->with(['reviewer:id,username,display_name,avatar_url', 'listing:id,ulid,title,slug'])
            ->when($request->reviewee_id, fn($q) => $q->where('reviewee_id', $request->reviewee_id))
            ->when($request->listing_id, fn($q) => $q->where('listing_id', $request->listing_id))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($reviews);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_ulid' => 'required|string|exists:orders,ulid',
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'nullable|string|max:2000',
        ]);

        $order = Order::where('ulid', $validated['order_ulid'])->firstOrFail();
        Gate::authorize('review', $order);

        $review = Review::create([
            'order_id' => $order->id,
            'reviewer_id' => $request->user()->id,
            'reviewee_id' => $order->seller_id,
            'listing_id' => $order->listing_id,
            'rating' => $validated['rating'],
            'body' => $validated['body'] ?? null,
            'is_published' => true,
        ]);

        $order->seller->notify(new ReviewReceived($review));

        return response()->json($review->load(['reviewer', 'listing']), 201);
    }

    public function reply(Request $request, string $ulid): JsonResponse
    {
        $review = Review::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('reply', $review);

        $validated = $request->validate([
            'seller_reply' => 'required|string|max:1000',
        ]);

        $review->update([
            'seller_reply' => $validated['seller_reply'],
            'seller_replied_at' => now(),
        ]);

        $review->reviewer->notify(new ReviewReplied($review));

        return response()->json($review->fresh());
    }
}
