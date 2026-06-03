<?php

namespace App\Livewire\Listing;

use App\Models\Listing;
use Livewire\Component;

class ListingStatusBadge extends Component
{
    public Listing $listing;

    public function conditionLabel(): string
    {
        return match ($this->listing->condition) {
            'new' => 'New',
            'like_new' => 'Like New',
            'good' => 'Good',
            'fair' => 'Fair',
            'poor' => 'Poor',
            default => ucfirst($this->listing->condition),
        };
    }

    public function conditionColor(): string
    {
        return match ($this->listing->condition) {
            'new' => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'like_new' => 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            'good' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'fair' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'poor' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            default => 'bg-zinc-100 text-zinc-600',
        };
    }

    public function render()
    {
        return view('livewire.listing.listing-status-badge');
    }
}
