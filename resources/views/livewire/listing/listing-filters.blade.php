<aside class="flex flex-col gap-6">
    {{-- Header --}}
    <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filters</h3>
        @if ($this->hasActiveFilters())
            <button wire:click="clearAll" class="text-xs text-violet-600 dark:text-violet-400 hover:underline">Clear all</button>
        @endif
    </div>

    {{-- Category --}}
    <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Category</label>
        <div class="flex flex-col gap-1">
            @foreach ($categories as $cat)
                <button
                    wire:click="$set('category_id', {{ $category_id === $cat->id ? 'null' : $cat->id }})"
                    class="flex items-center gap-2 text-sm text-left px-2 py-1.5 rounded-lg transition-colors {{ $category_id === $cat->id ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-medium' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800' }}"
                >
                    @if ($cat->icon)<span>{{ $cat->icon }}</span>@endif
                    {{ $cat->name }}
                </button>
                @if ($category_id === $cat->id && $cat->children->isNotEmpty())
                    <div class="ml-4 flex flex-col gap-1">
                        @foreach ($cat->children as $child)
                            <button
                                wire:click="$set('category_id', {{ $category_id === $child->id ? $cat->id : $child->id }})"
                                class="text-xs text-left px-2 py-1 rounded-lg transition-colors {{ $category_id === $child->id ? 'text-violet-600 dark:text-violet-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200' }}"
                            >
                                {{ $child->name }}
                            </button>
                        @endforeach
                    </div>
                @endif
            @endforeach
        </div>
    </div>

    {{-- Condition --}}
    <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Condition</label>
        <div class="flex flex-wrap gap-1.5">
            @foreach (['new' => 'New', 'like_new' => 'Like New', 'good' => 'Good', 'fair' => 'Fair', 'poor' => 'Poor'] as $val => $label)
                <button
                    wire:click="$set('condition', '{{ $condition === $val ? '' : $val }}')"
                    class="px-3 py-1 text-xs rounded-full border transition-colors {{ $condition === $val ? 'bg-violet-600 text-white border-violet-600' : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-violet-400' }}"
                >
                    {{ $label }}
                </button>
            @endforeach
        </div>
    </div>

    {{-- Price Range --}}
    <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Price Range</label>
        <div class="flex items-center gap-2">
            <div class="relative flex-1">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                <input wire:model.lazy="price_min" type="number" min="0" placeholder="Min" class="w-full pl-6 pr-2 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            </div>
            <span class="text-zinc-400 text-sm">–</span>
            <div class="relative flex-1">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                <input wire:model.lazy="price_max" type="number" min="0" placeholder="Max" class="w-full pl-6 pr-2 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            </div>
        </div>
    </div>

    {{-- Allows Offers --}}
    <label class="flex items-center gap-3 cursor-pointer">
        <input wire:model="allows_offers" type="checkbox" class="w-4 h-4 rounded text-violet-600 border-zinc-300 dark:border-zinc-600" />
        <span class="text-sm text-zinc-700 dark:text-zinc-300">Accepts offers</span>
    </label>
</aside>
