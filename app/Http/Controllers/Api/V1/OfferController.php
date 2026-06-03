<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Offer;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OfferController extends Controller
{
    public function __construct(private OfferService $offerService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $request->input('role', 'buyer');

        $offers = ($role === 'seller')
            ? Offer::where('seller_id', $user->id)
            : Offer::where('buyer_id', $user->id);

        $offers = $offers->with(['listing:id,ulid,title,slug,price', 'buyer:id,username,display_name,avatar_url'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listing_ulid' => 'required|string|exists:listings,ulid',
            'amount' => 'required|integer|min:1',
            'message' => 'nullable|string|max:500',
        ]);

        $listing = Listing::where('ulid', $validated['listing_ulid'])->firstOrFail();
        Gate::authorize('create', [Offer::class, $listing]);

        $offer = $this->offerService->create($request->user(), $listing, $validated['amount'], $validated['message'] ?? null);

        return response()->json($offer->load(['listing', 'buyer']), 201);
    }

    public function respond(Request $request, string $ulid): JsonResponse
    {
        $offer = Offer::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('respond', $offer);

        $validated = $request->validate([
            'action' => 'required|in:accept,decline,counter',
            'counter_amount' => 'required_if:action,counter|integer|min:1',
            'counter_message' => 'nullable|string|max:500',
        ]);

        $result = match ($validated['action']) {
            'accept' => $this->offerService->accept($offer, $request->user()),
            'decline' => $this->offerService->decline($offer, $request->user()),
            'counter' => $this->offerService->counter($offer, $request->user(), $validated['counter_amount'], $validated['counter_message'] ?? null),
        };

        return response()->json($result->load(['listing', 'buyer']));
    }
}
