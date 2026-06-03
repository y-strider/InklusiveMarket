<?php

namespace App\Livewire\Listing;

use App\Models\Category;
use Livewire\Attributes\Url;
use Livewire\Component;

class ListingFilters extends Component
{
    #[Url]
    public ?int $category_id = null;
    #[Url]
    public ?string $condition = null;
    #[Url]
    public ?int $price_min = null;
    #[Url]
    public ?int $price_max = null;
    #[Url]
    public ?string $ships_from = null;
    #[Url]
    public bool $allows_offers = false;

    public function updated(): void
    {
        $this->dispatch('filters-updated', [
            'category_id' => $this->category_id,
            'condition' => $this->condition,
            'price_min' => $this->price_min ? $this->price_min * 100 : null,
            'price_max' => $this->price_max ? $this->price_max * 100 : null,
            'ships_from' => $this->ships_from,
            'allows_offers' => $this->allows_offers,
        ]);
    }

    public function clearAll(): void
    {
        $this->category_id = null;
        $this->condition = null;
        $this->price_min = null;
        $this->price_max = null;
        $this->ships_from = null;
        $this->allows_offers = false;
        $this->dispatch('filters-updated', []);
    }

    public function hasActiveFilters(): bool
    {
        return $this->category_id || $this->condition || $this->price_min || $this->price_max || $this->ships_from || $this->allows_offers;
    }

    public function render()
    {
        return view('livewire.listing.listing-filters', [
            'categories' => Category::active()->roots()->with('children')->orderBy('sort_order')->get(),
        ]);
    }
}
