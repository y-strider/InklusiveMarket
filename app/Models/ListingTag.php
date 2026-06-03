<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingTag extends Model
{
    protected $fillable = ['listing_id', 'tag'];
    public $timestamps = false;

    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }
}
