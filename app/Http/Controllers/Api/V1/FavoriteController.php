<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = $request->user()->favoritedListings()
            ->with(['seller:id,username,display_name', 'coverImage', 'category:id,name,slug'])
            ->where('status', 'active')
            ->paginate(24);

        return response()->json($favorites);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listing_ulid' => 'required|string|exists:listings,ulid',
        ]);

        $listing = Listing::where('ulid', $validated['listing_ulid'])->firstOrFail();
        $user = $request->user();

        $existing = Favorite::where('user_id', $user->id)->where('listing_id', $listing->id)->first();

        if ($existing) {
            $existing->delete();
            $listing->decrement('favorites_count');
            $favorited = false;
        } else {
            Favorite::create(['user_id' => $user->id, 'listing_id' => $listing->id]);
            $listing->increment('favorites_count');
            $favorited = true;
        }

        return response()->json(['favorited' => $favorited, 'favorites_count' => $listing->fresh()->favorites_count]);
    }
}
