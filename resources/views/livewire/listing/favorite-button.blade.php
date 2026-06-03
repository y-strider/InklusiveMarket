<button
    wire:click="toggle"
    wire:loading.attr="disabled"
    type="button"
    class="flex items-center gap-1 rounded-full p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
    aria-label="{{ $favorited ? 'Remove from favorites' : 'Add to favorites' }}"
>
    @if ($favorited)
        <flux:icon.heart class="w-5 h-5 text-red-500 fill-red-500" />
    @else
        <flux:icon.heart class="w-5 h-5 text-zinc-400 hover:text-red-500 transition-colors" />
    @endif
</button>
