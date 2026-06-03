<?php

namespace App\Livewire\Listing;

use App\Models\Listing;
use Livewire\Component;

class ListingCard extends Component
{
    public Listing $listing;
    public bool $showSeller = true;

    public function render()
    {
        return view('livewire.listing.listing-card');
    }
}
