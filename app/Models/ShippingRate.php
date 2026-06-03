<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    protected $fillable = [
        'shippingprofileid','destination','price',
        'estimateddaysmin','estimateddaysmax',
    ];

    protected $casts = [
        'price' => 'integer',
        'estimateddaysmin' => 'integer',
        'estimateddaysmax' => 'integer',
    ];

    public function profile()
    {
        return $this->belongsTo(ShippingProfile::class, 'shippingprofileid');
    }

    public function priceInDollars(): string
    {
        return num_format($this->price / 100, 2);
    }
}
