<?php

namespace App\Livewire\Listing;

use App\Models\Listing;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;
use Livewire\WithPagination;

class ListingGrid extends Component
{
    use WithPagination;

    #[Url]
    public string $q = '';
    #[Url]
    public string $sort = 'newest';
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

    public int $sellerId = 0;

    #[On('filters-updated')]
    public function applyFilters(array $filters): void
    {
        $this->category_id = $filters['category_id'] ?? null;
        $this->condition = $filters['condition'] ?? null;
        $this->price_min = $filters['price_min'] ?? null;
        $this->price_max = $filters['price_max'] ?? null;
        $this->ships_from = $filters['ships_from'] ?? null;
        $this->allows_offers = $filters['allows_offers'] ?? false;
        $this->resetPage();
    }

    public function updatedQ(): void
    {
        $this->resetPage();
    }

    public function updatedSort(): void
    {
        $this->resetPage();
    }

    public function render()
    {
        $query = Listing::active()->with(['seller:id,username,display_name', 'coverImage', 'category:id,name,slug']);

        if ($this->sellerId) {
            $query->where('seller_id', $this->sellerId);
        }

        if ($this->q) {
            $ids = Listing::search($this->q)->keys();
            $query->whereIn('id', $ids);
        }

        $query
            ->when($this->category_id, fn($q) => $q->where('category_id', $this->category_id))
            ->when($this->condition, fn($q) => $q->where('condition', $this->condition))
            ->when($this->price_min, fn($q) => $q->where('price', '>=', $this->price_min))
            ->when($this->price_max, fn($q) => $q->where('price', '<=', $this->price_max))
            ->when($this->ships_from, fn($q) => $q->where('ships_from', $this->ships_from))
            ->when($this->allows_offers, fn($q) => $q->where('allows_offers', true));

        $sortMap = [
            'newest' => ['published_at', 'desc'],
            'price_asc' => ['price', 'asc'],
            'price_desc' => ['price', 'desc'],
            'popular' => ['favorites_count', 'desc'],
        ];
        [$col, $dir] = $sortMap[$this->sort] ?? ['published_at', 'desc'];
        $query->orderBy($col, $dir);

        $listings = $query->paginate(24);

        return view('livewire.listing.listing-grid', compact('listings'));
    }
}
