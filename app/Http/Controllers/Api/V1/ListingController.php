<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Listing::active()->with(['seller:id,username,display_name,avatar_url', 'category:id,name,slug', 'coverImage']);

        if ($q = $request->input('q')) {
            $ids = Listing::search($q)
                ->when($request->category_id, fn($s) => $s->where('category_id', (int) $request->category_id))
                ->when($request->condition, fn($s) => $s->where('condition', $request->condition))
                ->when($request->price_min, fn($s) => $s->where('price', '>=', (int) $request->price_min))
                ->when($request->price_max, fn($s) => $s->where('price', '<=', (int) $request->price_max))
                ->when($request->allows_offers, fn($s) => $s->where('allows_offers', true))
                ->when($request->ships_from, fn($s) => $s->where('ships_from', $request->ships_from))
                ->keys();
            $query->whereIn('id', $ids);
        } else {
            $query
                ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
                ->when($request->condition, fn($q) => $q->where('condition', $request->condition))
                ->when($request->price_min, fn($q) => $q->where('price', '>=', (int) $request->price_min))
                ->when($request->price_max, fn($q) => $q->where('price', '<=', (int) $request->price_max))
                ->when($request->allows_offers, fn($q) => $q->where('allows_offers', true))
                ->when($request->ships_from, fn($q) => $q->where('ships_from', $request->ships_from));
        }

        $sortMap = [
            'price_asc' => ['price', 'asc'],
            'price_desc' => ['price', 'desc'],
            'newest' => ['published_at', 'desc'],
            'popular' => ['favorites_count', 'desc'],
            'views' => ['views_count', 'desc'],
        ];

        [$col, $dir] = $sortMap[$request->input('sort', 'newest')] ?? ['published_at', 'desc'];
        $query->orderBy($col, $dir);

        return response()->json($query->paginate(24));
    }

    public function show(string $ulid): JsonResponse
    {
        $listing = Listing::where('ulid', $ulid)
            ->with(['seller:id,ulid,username,display_name,avatar_url', 'category', 'images', 'tags', 'attributes'])
            ->firstOrFail();

        Gate::authorize('view', $listing);
        $listing->incrementViews();

        return response()->json($listing);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Listing::class);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'price' => 'required|integer|min:1',
            'compare_at_price' => 'nullable|integer|min:1',
            'condition' => 'required|in:new,like_new,good,fair,poor',
            'quantity' => 'integer|min:1|max:999',
            'allows_offers' => 'boolean',
            'ships_from' => 'nullable|string|max:100',
            'estimated_shipping_days' => 'nullable|integer|min:1',
            'tags' => 'array|max:10',
            'tags.*' => 'string|max:50',
        ]);

        $listing = $request->user()->listings()->create(array_merge($validated, ['status' => 'draft', 'visibility' => 'public']));

        if (!empty($validated['tags'])) {
            foreach ($validated['tags'] as $tag) {
                $listing->tags()->create(['tag' => $tag]);
            }
        }

        return response()->json($listing->load(['category', 'tags']), 201);
    }

    public function update(Request $request, string $ulid): JsonResponse
    {
        $listing = Listing::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('update', $listing);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'title' => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'price' => 'sometimes|integer|min:1',
            'compare_at_price' => 'nullable|integer|min:1',
            'condition' => 'sometimes|in:new,like_new,good,fair,poor',
            'status' => 'sometimes|in:draft,active,archived',
            'visibility' => 'sometimes|in:public,unlisted,private',
            'quantity' => 'sometimes|integer|min:0',
            'allows_offers' => 'sometimes|boolean',
            'ships_from' => 'nullable|string|max:100',
            'tags' => 'sometimes|array|max:10',
            'tags.*' => 'string|max:50',
        ]);

        if (isset($validated['tags'])) {
            $listing->tags()->delete();
            foreach ($validated['tags'] as $tag) {
                $listing->tags()->create(['tag' => $tag]);
            }
            unset($validated['tags']);
        }

        if (isset($validated['status']) && $validated['status'] === 'active' && !$listing->published_at) {
            $validated['published_at'] = now();
        }

        $listing->update($validated);

        return response()->json($listing->fresh(['category', 'tags', 'images']));
    }

    public function destroy(string $ulid): JsonResponse
    {
        $listing = Listing::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('delete', $listing);
        $listing->delete();
        return response()->json(['message' => 'Listing deleted.']);
    }
}
