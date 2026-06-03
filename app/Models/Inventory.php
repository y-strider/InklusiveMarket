<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'product_id',
        'currentstock',
        'reservedstock',
        'lowstockthreshold',
        'lastupdated',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}