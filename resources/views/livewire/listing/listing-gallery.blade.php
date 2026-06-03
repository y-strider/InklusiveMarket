<div class="flex flex-col gap-3">
    {{-- Main Image --}}
    <div class="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
        @php $images = $listing->images; $active = $images->get($activeIndex); @endphp
        @if ($active)
            <img
                src="{{ $active->url }}"
                alt="{{ $active->alt_text ?? $listing->title }}"
                class="w-full h-full object-contain"
            />
        @else
            <div class="w-full h-full flex items-center justify-center text-zinc-400">
                <flux:icon.photo class="w-16 h-16" />
            </div>
        @endif

        @if ($images->count() > 1)
            <button wire:click="prev" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-zinc-800/80 rounded-full p-2 shadow hover:scale-110 transition-transform">
                <flux:icon.chevron-left class="w-5 h-5" />
            </button>
            <button wire:click="next" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-zinc-800/80 rounded-full p-2 shadow hover:scale-110 transition-transform">
                <flux:icon.chevron-right class="w-5 h-5" />
            </button>
        @endif
    </div>

    {{-- Thumbnails --}}
    @if ($images->count() > 1)
        <div class="flex gap-2 overflow-x-auto pb-1">
            @foreach ($images as $i => $image)
                <button
                    wire:click="setActive({{ $i }})"
                    class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors {{ $activeIndex === $i ? 'border-violet-500' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600' }}"
                >
                    <img src="{{ $image->thumbnail_url ?? $image->url }}" alt="{{ $image->alt_text }}" class="w-full h-full object-cover" />
                </button>
            @endforeach
        </div>
    @endif
</div>
