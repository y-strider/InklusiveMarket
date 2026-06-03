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
            ? Offer::where('sellerid', $user->id)
            : Offer::where('buyerid', $user->id);
        $offers = $offers->with(['listing:id,ulid,title,slug,price', 'buyer:id,username,displayname,avatarurl'])
            ->when($request->string('status')->toString(), fn($q, $v) => $q->where('status', $v))
            ->orderBy('createdat', 'desc')
            ->paginate(20);
        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listingulid' => 'required|string|exists:listings,ulid',
            'amount' => 'required|integer|min:1',
            'message' => 'nullable|string|max:500',
        ]);
        $listing = Listing::where('ulid', $validated['listingulid'])->firstOrFail();
        Gate::authorize('create', [Offer::class, $listing]);
        $offer = $this->offerService->create($request->user(), $listing, $validated['amount'], $validated['message'] ?? null);
        return response()->json($offer->load(['listing','buyer']), 201);
    }

    public function respond(Request $request, string $ulid): JsonResponse
    {
        $offer = Offer::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('respond', $offer);
        $validated = $request->validate([
            'action' => 'required|in:accept,decline,counter',
            'counteramount' => 'required_if:action,counter|integer|min:1',
            'countermessage' => 'nullable|string|max:500',
        ]);
        $result = match ($validated['action']) {
            'accept' => $this->offerService->accept($offer, $request->user()),
            'decline' => $this->offerService->decline($offer, $request->user()),
            'counter' => $this->offerService->counter($offer, $request->user(), $validated['counteramount'], $validated['countermessage'] ?? null),
        };
        return response()->json($result->load(['listing','buyer']));
    }
}
