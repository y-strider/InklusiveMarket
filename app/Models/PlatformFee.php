<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformFee extends Model
{
    protected $fillable = ['order_id', 'amount', 'percentage'];

    protected $casts = [
        'amount' => 'integer',
        'percentage' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function amountInDollars(): string
    {
        return number_format($this->amount / 100, 2);
    }
}
