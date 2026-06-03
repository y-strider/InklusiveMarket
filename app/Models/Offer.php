<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Offer extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSPENDING = 'pending';
    const STATUSACCEPTED = 'accepted';
    const STATUSDECLINED = 'declined';
    const STATUSEXPIRED = 'expired';
    const STATUSWITHDRAWN = 'withdrawn';
    const STATUSCOUNTERED = 'countered';

    protected $fillable = [
        'ulid','listingid','buyerid','sellerid','amount','message',
        'status','expiresat','parentofferid','respondedat',
    ];

    protected $casts = [
        'amount' => 'integer',
        'expiresat' => 'datetime',
        'respondedat' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Offer $offer) {
            if (empty($offer->ulid)) {
                $offer->ulid = Str::ulid()->toBase32();
            }
            if (empty($offer->expiresat)) {
                $offer->expiresat = now()->addHours(48);
            }
        });
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyerid');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'sellerid');
    }

    public function parentOffer()
    {
        return $this->belongsTo(Offer::class, 'parentofferid');
    }

    public function counterOffers()
    {
        return $this->hasMany(Offer::class, 'parentofferid');
    }

    public function order()
    {
        return $this->hasOne(Order::class);
    }

    public function amountInDollars(): string
    {
        return number_format($this->amount / 100, 2);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUSPENDING;
    }

    public function isExpired(): bool
    {
        return $this->expiresat && $this->expiresat->isPast() && $this->status === self::STATUSPENDING;
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
