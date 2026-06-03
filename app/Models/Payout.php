<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payout extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid', 'seller_id', 'order_id', 'stripe_payout_id',
        'amount', 'currency', 'status', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Payout $p) {
            if (empty($p->ulid)) {
                $p->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function amountInDollars(): string
    {
        return number_format($this->amount / 100, 2);
    }
}
