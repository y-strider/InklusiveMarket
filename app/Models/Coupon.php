<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code','type','value','maxuses','usedcount','expiresat','isactive',
    ];

    protected $casts = [
        'value' => 'integer',
        'maxuses' => 'integer',
        'usedcount' => 'integer',
        'expiresat' => 'datetime',
        'isactive' => 'boolean',
    ];

    public function uses()
    {
        return $this->hasMany(CouponUse::class);
    }

    public function isValid(): bool
    {
        if (!$this->isactive) return false;
        if ($this->expiresat && $this->expiresat->isPast()) return false;
        if ($this->maxuses && $this->usedcount >= $this->maxuses) return false;
        return true;
    }

    public function discountFor(int $priceInCents): int
    {
        if ($this->type === 'percentage') {
            return (int)round($priceInCents * ($this->value / 100));
        }
        return min($this->value, $priceInCents);
    }

    public function scopeActive($query)
    {
        return $query->where('isactive', true)
            ->where(function ($q) {
                $q->whereNull('expiresat')->orWhere('expiresat', '>', now());
            });
    }
}
