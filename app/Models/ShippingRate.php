<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    protected $fillable = [
        'shipping_profile_id', 'destination', 'price',
        'estimated_days_min', 'estimated_days_max',
    ];

    protected $casts = [
        'price' => 'integer',
        'estimated_days_min' => 'integer',
        'estimated_days_max' => 'integer',
    ];

    public function profile()
    {
        return $this->belongsTo(ShippingProfile::class, 'shipping_profile_id');
    }

    public function priceInDollars(): string
    {
        return number_format($this->price / 100, 2);
    }
}
