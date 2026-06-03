<div class="flex flex-col gap-4">
    {{-- Toolbar --}}
    <div class="flex items-center justify-between gap-4">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
            {{ $listings->total() }} {{ Str::plural('result', $listings->total()) }}
        </p>
        <div class="flex items-center gap-2">
            <label class="text-sm text-zinc-600 dark:text-zinc-400">Sort:</label>
            <select wire:model.live="sort" class="text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
            </select>
        </div>
    </div>

    {{-- Active Filter Chips --}}
    @if ($condition || $price_min || $price_max || $allows_offers)
        <div class="flex flex-wrap gap-2">
            @if ($condition)
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium">
                    {{ ucfirst(str_replace('_', ' ', $condition)) }}
                    <button wire:click="$set('condition', '')" class="hover:text-violet-900 ml-1">×</button>
                </span>
            @endif
            @if ($price_min || $price_max)
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium">
                    ${{ $price_min ? number_format($price_min/100, 0) : '0' }} – ${{ $price_max ? number_format($price_max/100, 0) : '∞' }}
                    <button wire:click="$set('price_min', null); $set('price_max', null)" class="hover:text-violet-900 ml-1">×</button>
                </span>
            @endif
            @if ($allows_offers)
                <span class="inline-flex items-center gap
