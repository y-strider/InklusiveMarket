<?php

namespace App\Livewire\Listing;

use App\Models\Favorite;
use App\Models\Listing;
use Livewire\Component;

class FavoriteButton extends Component
{
    public Listing $listing;
    public bool $favorited = false;
    public int $count = 0;

    public function mount(): void
    {
        $this->count = $this->listing->favorites_count;
        if (auth()->check()) {
            $this->favorited = Favorite::where('user_id', auth()->id())
                ->where('listing_id', $this->listing->id)
                ->exists();
        }
    }

    public function toggle(): void
    {
        if (!auth()->check()) {
            $this->redirect(route('login'));
            return;
        }

        $existing = Favorite::where('user_id', auth()->id())
            ->where('listing_id', $this->listing->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $this->listing->decrement('favorites_count');
            $this->favorited = false;
            $this->count = max(0, $this->count - 1);
        } else {
            Favorite::create(['user_id' => auth()->id(), 'listing_id' => $this->listing->id]);
            $this->listing->increment('favorites_count');
            $this->favorited = true;
            $this->count++;
        }
    }

    public function render()
    {
        return view('livewire.listing.favorite-button');
    }
}
