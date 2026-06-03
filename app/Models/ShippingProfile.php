<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingProfile extends Model
{
    use HasFactory;

    protected $fillable = ['seller_id', 'name', 'is_default'];

    protected $casts = ['is_default' => 'boolean'];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function rates()
    {
        return $this->hasMany(ShippingRate::class);
    }
}
