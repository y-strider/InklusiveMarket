<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Offer extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_DECLINED = 'declined';
    const STATUS_EXPIRED = 'expired';
    const STATUS_WITHDRAWN = 'withdrawn';
    const STATUS_COUNTERED = 'countered';

    protected $fillable = [
        'ulid', 'listing_id', 'buyer_id', 'seller_id', 'amount', 'message',
        'status', 'expires_at', 'parent_offer_id', 'responded_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'expires_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Offer $offer) {
            if (empty($offer->ulid)) {
                $offer->ulid = Str::ulid()->toBase32();
            }
            if (empty($offer->expires_at)) {
                $offer->expires_at = now()->addHours(48);
            }
        });
    }

    // Relations
    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function parentOffer()
    {
        return $this->belongsTo(Offer::class, 'parent_offer_id');
    }

    public function counterOffers()
    {
        return $this->hasMany(Offer::class, 'parent_offer_id');
    }

    public function order()
    {
        return $this->hasOne(Order::class);
    }

    // Helpers
    public function amountInDollars(): string
    {
        return number_format($this->amount / 100, 2);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast() && $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->isPending() && !$this->isExpired();
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }
}
