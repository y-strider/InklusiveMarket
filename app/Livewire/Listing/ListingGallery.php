<?php

namespace App\Livewire\Listing;

use App\Models\Listing;
use Livewire\Component;

class ListingGallery extends Component
{
    public Listing $listing;
    public int $activeIndex = 0;

    public function setActive(int $index): void
    {
        $this->activeIndex = $index;
    }

    public function prev(): void
    {
        $count = $this->listing->images->count();
        $this->activeIndex = ($this->activeIndex - 1 + $count) % $count;
    }

    public function next(): void
    {
        $count = $this->listing->images->count();
        $this->activeIndex = ($this->activeIndex + 1) % $count;
    }

    public function render()
    {
        return view('livewire.listing.listing-gallery');
    }
}
