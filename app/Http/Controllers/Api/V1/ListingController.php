<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Listing::active()->with(['seller:id,username,displayname,avatarurl', 'category:id,name,slug', 'coverImage']);

        $search = (string) $request->query('q', '');
        if ($search !== '') {
            $ids = Listing::search($search)
                ->when($request->integer('categoryid'), fn($s) => $s->where('categoryid', (int) $request->integer('categoryid')))
                ->when((string) $request->query('condition', '') !== '', fn($s) => $s->where('condition', (string) $request->query('condition')))
                ->when($request->integer('pricemin'), fn($s) => $s->where('price', '>=', (int) $request->integer('pricemin')))
                ->when($request->integer('pricemax'), fn($s) => $s->where('price', '<=', (int) $request->integer('pricemax')))
                ->when($request->boolean('allowsoffers'), fn($s) => $s->where('allowsoffers', true))
                ->when((string) $request->query('shipsfrom', '') !== '', fn($s) => $s->where('shipsfrom', (string) $request->query('shipsfrom')))
                ->keys();
            $query->whereIn('id', $ids);
        } else {
            $query
                ->when($request->integer('categoryid'), fn($q2, $v) => $q2->where('categoryid', $v))
                ->when((string) $request->query('condition', '') !== '', fn($q2) => $q2->where('condition', (string) $request->query('condition')))
                ->when($request->integer('pricemin'), fn($q2, $v) => $q2->where('price', '>=', (int) $v))
                ->when($request->integer('pricemax'), fn($q2, $v) => $q2->where('price', '<=', (int) $v))
                ->when($request->boolean('allowsoffers'), fn($q2) => $q2->where('allowsoffers', true))
                ->when((string) $request->query('shipsfrom', '') !== '', fn($q2) => $q2->where('shipsfrom', (string) $request->query('shipsfrom')));
        }

        $sortMap = [
            'priceasc' => ['price','asc'],
            'pricedesc' => ['price','desc'],
            'newest' => ['publishedat','desc'],
            'popular' => ['favoritescount','desc'],
            'views' => ['viewscount','desc'],
        ];
        [$col, $dir] = $sortMap[$request->input('sort', 'newest')] ?? ['publishedat','desc'];
        $query->orderBy($col, $dir);

        return response()->json($query->paginate(24));
    }

    public function show(string $ulid): JsonResponse
    {
        $listing = Listing::where('ulid', $ulid)
            ->with(['seller:id,ulid,username,displayname,avatarurl', 'category', 'images', 'tags', 'attributes'])
            ->firstOrFail();

        Gate::authorize('view', $listing);
        $listing->incrementViews();

        return response()->json($listing);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Listing::class);

        $validated = $request->validate([
            'categoryid' => 'required|exists:categories,id',
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'price' => 'required|integer|min:1',
            'compareatprice' => 'nullable|integer|min:1',
            'condition' => 'required|in:new,likenew,good,fair,poor',
            'quantity' => 'integer|min:1|max:999',
            'allowsoffers' => 'boolean',
            'shipsfrom' => 'nullable|string|max:100',
            'estimatedshippingdays' => 'nullable|integer|min:1',
            'tags' => 'array|max:10',
            'tags.*' => 'string|max:50',
        ]);

        $data = array_merge($validated, ['status' => 'draft', 'visibility' => 'public']);
        $listing = $request->user()->listings()->create($data);

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
            'categoryid' => 'sometimes|exists:categories,id',
            'title' => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'price' => 'sometimes|integer|min:1',
            'compareatprice' => 'nullable|integer|min:1',
            'condition' => 'sometimes|in:new,likenew,good,fair,poor',
            'status' => 'sometimes|in:draft,active,archived',
            'visibility' => 'sometimes|in:public,unlisted,private',
            'quantity' => 'sometimes|integer|min:0',
            'allowsoffers' => 'sometimes|boolean',
            'shipsfrom' => 'nullable|string|max:100',
            'tags' => 'sometimes|array|max:10',
            'tags.*' => 'string|max:50',
        ]);

        if (arrkeyexists('tags', $validated)) {
            $listing->tags()->delete();
            foreach ((array) $validated['tags'] as $tag) {
                $listing->tags()->create(['tag' => $tag]);
            }
            unset($validated['tags']);
        }

        if (isset($validated['status']) && $validated['status'] === 'active' && !$listing->publishedat) {
            $validated['publishedat'] = now();
        }

        $listing->update($validated);

        return response()->json($listing->fresh(['category','tags','images']));
    }

    public function destroy(string $ulid): JsonResponse
    {
        $listing = Listing::where('ulid', $ulid)->firstOrFail();
        Gate::authorize('delete', $listing);
        $listing->delete();
        return response()->json(['message' => 'Listing deleted.']);
    }
}
