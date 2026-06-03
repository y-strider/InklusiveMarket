<div class="flex flex-col gap-4">
    {{-- Toolbar --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="text-sm text-zinc-600 dark:text-zinc-400">
            @if ($listings->total() > 0)
                Showing
                <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ $listings->firstItem() }}</span>
                –
                <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ $listings->lastItem() }}</span>
                of
                <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ $listings->total() }}</span>
                results
            @else
                No results
            @endif
        </div>

        <div class="flex items-center gap-2">
            <input
                wire:model.debounce.400ms="q"
                type="search"
                placeholder="Search listings..."
                class="w-full sm:w-64 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />

            <select
                wire:model="sort"
                class="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                aria-label="Sort"
            >
                <option value="newest">Newest</option>
                <option value="priceasc">Price: Low to High</option>
                <option value="pricedesc">Price: High to Low</option>
                <option value="popular">Most Favorited</option>
            </select>
        </div>
    </div>

    {{-- Loading state bar --}}
    <div wire:loading class="w-full h-1 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div class="h-full w-1/3 bg-violet-500 animate-[loading_1.2s_infinite]"></div>
    </div>

    {{-- Results grid --}}
    @if ($listings->count() > 0)
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            @foreach ($listings as $listing)
                <livewire:listing.listing-card :listing="$listing" :key="'card-'.$listing->id" />
            @endforeach
        </div>

        {{-- Pagination --}}
        <div class="mt-4">
            {{ $listings->onEachSide(1)->links() }}
        </div>
    @else
        {{-- Empty state --}}
        <div class="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <div class="rounded-full p-4 bg-zinc-100 dark:bg-zinc-800 mb-3">
                <flux:icon.search class="w-6 h-6 text-zinc-500" />
            </div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No listings found</h3>
            <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                Try adjusting your search or filters. You can clear filters to see more results.
            </p>
        </div>
    @endif
</div>

<style>
@keyframes loading {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(50%); }
    100% { transform: translateX(200%); }
}
</style>
