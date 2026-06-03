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
            ->with(['seller:id,username,displayname', 'coverImage', 'category:id,name,slug'])
            ->where('status', 'active')
            ->paginate(24);
        return response()->json($favorites);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listingulid' => 'required|string|exists:listings,ulid',
        ]);
        $listing = Listing::where('ulid', $validated['listingulid'])->firstOrFail();
        $user = $request->user();
        $existing = Favorite::where('userid', $user->id)->where('listingid', $listing->id)->first();
        if ($existing) {
            $existing->delete();
            $listing->decrement('favoritescount');
            if ($listing->favoritescount < 0) {
                $listing->update(['favoritescount' => 0]);
            }
            $favorited = false;
        } else {
            Favorite::create(['userid' => $user->id, 'listingid' => $listing->id]);
            $listing->increment('favoritescount');
            $favorited = true;
        }
        return response()->json(['favorited' => $favorited, 'favoritescount' => $listing->fresh()->favoritescount]);
    }
}
