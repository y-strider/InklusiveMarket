<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payout extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid','sellerid','orderid','stripepayoutid',
        'amount','currency','status','paidat',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paidat' => 'datetime',
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
        return $this->belongsTo(User::class, 'sellerid');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function amountInDollars(): string
    {
        return num_format($this->amount / 100, 2);
    }
}
