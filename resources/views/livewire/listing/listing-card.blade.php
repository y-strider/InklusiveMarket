<div class="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    {{-- Cover Image --}}
    <a href="{{ route('listings.show', $listing->slug) }}" class="block aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        @if ($listing->coverImage)
            <img
                src="{{ $listing->coverImage->url }}"
                alt="{{ $listing->coverImage->alt_text ?? $listing->title }}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
            />
        @else
            <div class="w-full h-full flex items-center justify-center text-zinc-400">
                <flux:icon.photo class="w-12 h-12" />
            </div>
        @endif

        {{-- Sale Badge --}}
        @if ($listing->isOnSale())
            <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{{ $listing->discountPercentage() }}%
            </div>
        @endif

        {{-- Favorite Button --}}
        <div class="absolute top-2 right-2">
            @auth
                <livewire:listing.favorite-button :listing="$listing" :key="'fav-'.$listing->id" />
            @endauth
        </div>
    </a>

    {{-- Card Body --}}
    <div class="flex flex-col flex-1 p-3 gap-1">
        {{-- Condition Badge --}}
        <div class="flex items-center gap-2">
            <livewire:listing.listing-status-badge :listing="$listing" :key="'badge-'.$listing->id" />
        </div>

        {{-- Title --}}
        <a href="{{ route('listings.show', $listing->slug) }}" class="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            {{ $listing->title }}
        </a>

        {{-- Price --}}
        <div class="flex items-baseline gap-2 mt-auto pt-1">
            <span class="text-base font-bold text-zinc-900 dark:text-zinc-100">${{ $listing->priceInDollars() }}</span>
            @if ($listing->isOnSale())
                <span class="text-xs text-zinc-400 line-through">${{ $listing->compareAtPriceInDollars() }}</span>
            @endif
        </div>

        {{-- Seller --}}
        @if ($showSeller)
            <a href="{{ route('sellers.show', $listing->seller->username) }}" class="text-xs text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 truncate">
                {{ $listing->seller->display_name }}
            </a>
        @endif
    </div>
</div>
