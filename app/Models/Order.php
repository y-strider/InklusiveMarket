<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Order extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    const STATUSPENDING = 'pending';
    const STATUSPAID = 'paid';
    const STATUSPROCESSING = 'processing';
    const STATUSSHIPPED = 'shipped';
    const STATUSDELIVERED = 'delivered';
    const STATUSCOMPLETED = 'completed';
    const STATUSCANCELLED = 'cancelled';
    const STATUSREFUNDED = 'refunded';
    const STATUSDISPUTED = 'disputed';

    protected $fillable = [
        'ulid','buyerid','sellerid','listingid','offerid',
        'title','price','currency','quantity','status',
        'stripepaymentintentid','stripetransferid',
        'shippingaddress','trackingnumber',
        'shippedat','deliveredat','completedat','cancelledat',
        'cancellationreason','notes',
    ];

    protected $casts = [
        'price' => 'integer',
        'quantity' => 'integer',
        'shippingaddress' => 'array',
        'shippedat' => 'datetime',
        'deliveredat' => 'datetime',
        'completedat' => 'datetime',
        'cancelledat' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->ulid)) {
                $order->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status'])->logOnlyDirty();
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyerid');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'sellerid');
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(OrderStatusLog::class)->orderBy('createdat', 'desc');
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function dispute()
    {
        return $this->hasOne(Dispute::class);
    }

    public function platformFee()
    {
        return $this->hasOne(PlatformFee::class);
    }

    public function payouts()
    {
        return $this->hasMany(Payout::class);
    }

    public function conversation()
    {
        return $this->hasOne(Conversation::class);
    }

    public function priceInDollars(): string
    {
        return numformat($this->price / 100, 2);
    }

    public function sellerAmount(): int
    {
        return (int) round($this->price * 0.92);
    }

    public function platformFeeAmount(): int
    {
        return $this->price - $this->sellerAmount();
    }

    public function canBeReviewed(): bool
    {
        return $this->status === self::STATUSCOMPLETED && !$this->review()->exists();
    }

    public function canBeDisputed(): bool
    {
        return in_array($this->status, [self::STATUSPAID, self::STATUSPROCESSING, self::STATUSSHIPPED, self::STATUSDELIVERED], true)
            && !$this->dispute()->exists();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUSPENDING, self::STATUSPAID, self::STATUSPROCESSING], true);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUSCOMPLETED;
    }

    public function transitionTo(string $newStatus, ?int $changedBy = null, ?string $note = null): void
    {
        $oldStatus = $this->status;
        $this->update(['status' => $newStatus]);
        $this->statusLogs()->create([
            'fromstatus' => $oldStatus,
            'tostatus' => $newStatus,
            'changedby' => $changedBy,
            'note' => $note,
        ]);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function scopeForBuyer($query, int $buyerId)
    {
        return $query->where('buyerid', $buyerId);
    }

    public function scopeForSeller($query, int $sellerId)
    {
        return $query->where('sellerid', $sellerId);
    }
}
