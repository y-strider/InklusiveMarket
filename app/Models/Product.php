<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'seller_id',
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'approval_status',
        'is_featured',
    ];

    public function seller()
    {
        return $this->belongsTo(Seller::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_items');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function inventory()
    {
        return $this->hasOne(Inventory::class);
    }

    public function getViewsAttribute()
    {
        return $this->attributes['views'] ?? 0;
    }

    protected static function booted()
    {
        static::creating(function ($p) {
            $p->slug = \Str::slug($p->name . '-' . \Str::random(4));
        });
    }
}
