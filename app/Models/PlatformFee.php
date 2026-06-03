<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformFee extends Model
{
    protected $fillable = ['orderid','amount','percentage'];

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
        return numformat($this->amount / 100, 2);
    }
}
