<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'reference',
        'buyer_id',
        'amount',
        'status',
        'created_at',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }
}