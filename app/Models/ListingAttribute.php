<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingAttribute extends Model
{
    protected $fillable = ['listing_id', 'key', 'value'];

    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }
}
