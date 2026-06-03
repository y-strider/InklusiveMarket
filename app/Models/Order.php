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

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_DISPUTED = 'disputed';

    protected $fillable = [
        'ulid', 'buyer_id', 'seller_id', 'listing_id', 'offer_id',
        'title', 'price', 'currency', 'quantity', 'status',
        'stripe_payment_intent_id', 'stripe_transfer_id',
        'shipping_address', 'tracking_number',
        'shipped_at', 'delivered_at', 'completed_at', 'cancelled_at',
        'cancellation_reason', 'notes',
    ];

    protected $casts = [
        'price' => 'integer',
        'quantity' => 'integer',
        'shipping_address' => 'array',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
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

    // Relations
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
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
        return $this->hasMany(OrderStatusLog::class)->orderBy('created_at', 'desc');
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

    // Helpers
    public function priceInDollars(): string
    {
        return number_format($this->price / 100, 2);
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
        return $this->status === self::STATUS_COMPLETED && !$this->review()->exists();
    }

    public function canBeDisputed(): bool
    {
        return in_array($this->status, [self::STATUS_PAID, self::STATUS_PROCESSING, self::STATUS_SHIPPED, self::STATUS_DELIVERED])
            && !$this->dispute()->exists();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PAID, self::STATUS_PROCESSING]);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function transitionTo(string $newStatus, ?int $changedBy = null, ?string $note = null): void
    {
        $oldStatus = $this->status;
        $this->update(['status' => $newStatus]);
        $this->statusLogs()->create([
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'changed_by' => $changedBy,
            'note' => $note,
        ]);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function scopeForBuyer($query, int $buyerId)
    {
        return $query->where('buyer_id', $buyerId);
    }

    public function scopeForSeller($query, int $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }
}
