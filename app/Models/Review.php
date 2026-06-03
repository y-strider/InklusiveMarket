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
        'ulid','orderid','reviewerid','revieweeid','listingid',
        'rating','body','sellerreply','sellerrepliedat',
        'isflagged','flagreason','ispublished',
    ];

    protected $casts = [
        'rating' => 'integer',
        'isflagged' => 'boolean',
        'ispublished' => 'boolean',
        'sellerrepliedat' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Review $review) {
            if (empty($review->ulid)) {
                $review->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewerid');
    }

    public function reviewee()
    {
        return $this->belongsTo(User::class, 'revieweeid');
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function starsArray(): array
    {
        return arraymap(fn($i) => $i <= $this->rating, range(1, 5));
    }

    public function hasReply(): bool
    {
        return !empty($this->sellerreply);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function scopePublished($query)
    {
        return $query->where('ispublished', true);
    }
}
