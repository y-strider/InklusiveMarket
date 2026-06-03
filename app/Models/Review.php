<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Review extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ulid', 'order_id', 'reviewer_id', 'reviewee_id', 'listing_id',
        'rating', 'body', 'seller_reply', 'seller_replied_at',
        'is_flagged', 'flag_reason', 'is_published',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_flagged' => 'boolean',
        'is_published' => 'boolean',
        'seller_replied_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Review $review) {
            if (empty($review->ulid)) {
                $review->ulid = Str::ulid()->toBase32();
            }
        });
    }

    // Relations
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function reviewee()
    {
        return $this->belongsTo(User::class, 'reviewee_id');
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    // Helpers
    public function starsArray(): array
    {
        return array_map(fn($i) => $i <= $this->rating, range(1, 5));
    }

    public function hasReply(): bool
    {
        return !empty($this->seller_reply);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
