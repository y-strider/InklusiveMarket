<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Listing extends Model
{
    use HasFactory, SoftDeletes, Searchable, LogsActivity;

    protected $fillable = [
        'ulid', 'seller_id', 'category_id', 'title', 'slug', 'description',
        'price', 'compare_at_price', 'currency', 'condition', 'status', 'visibility',
        'quantity', 'allows_offers', 'ships_from', 'estimated_shipping_days',
        'views_count', 'favorites_count', 'published_at',
    ];

    protected $casts = [
        'price' => 'integer',
        'compare_at_price' => 'integer',
        'quantity' => 'integer',
        'views_count' => 'integer',
        'favorites_count' => 'integer',
        'allows_offers' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Listing $listing) {
            if (empty($listing->ulid)) {
                $listing->ulid = Str::ulid()->toBase32();
            }
            if (empty($listing->slug)) {
                $listing->slug = static::generateSlug($listing->title, $listing->ulid);
            }
        });
    }

    public static function generateSlug(string $title, string $ulid): string
    {
        return Str::slug($title) . '-' . strtolower($ulid);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status', 'visibility', 'price'])->logOnlyDirty();
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'title' => $this->title,
            'description' => $this->description,
            'tags' => $this->tags->pluck('tag')->join(' '),
            'category_name' => $this->category?->name,
            'seller_username' => $this->seller?->username,
            'condition' => $this->condition,
            'status' => $this->status,
            'price' => $this->price,
            'currency' => $this->currency,
            'ships_from' => $this->ships_from,
            'allows_offers' => $this->allows_offers,
            'category_id' => $this->category_id,
            'seller_id' => $this->seller_id,
            'favorites_count' => $this->favorites_count,
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->timestamp,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'active' && $this->visibility === 'public' && !$this->trashed();
    }

    // Relations
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ListingImage::class)->orderBy('sort_order');
    }

    public function coverImage()
    {
        return $this->hasOne(ListingImage::class)->where('is_cover', true)->orderBy('sort_order');
    }

    public function tags()
    {
        return $this->hasMany(ListingTag::class);
    }

    public function attributes()
    {
        return $this->hasMany(ListingAttribute::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoritedByUsers()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // Helpers
    public function priceInDollars(): string
    {
        return number_format($this->price / 100, 2);
    }

    public function compareAtPriceInDollars(): ?string
    {
        return $this->compare_at_price ? number_format($this->compare_at_price / 100, 2) : null;
    }

    public function isOnSale(): bool
    {
        return $this->compare_at_price && $this->compare_at_price > $this->price;
    }

    public function discountPercentage(): ?int
    {
        if (!$this->isOnSale()) return null;
        return (int) round((($this->compare_at_price - $this->price) / $this->compare_at_price) * 100);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSold(): bool
    {
        return $this->status === 'sold';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('visibility', 'public');
    }

    public function scopeForSeller($query, int $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }
}
