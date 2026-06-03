<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatusLog extends Model
{
    protected $fillable = ['orderid','fromstatus','tostatus','changedby','note'];
    public $timestamps = true;
    const UPDATED_AT = null;

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function changer()
    {
        return $this->belongsTo(User::class, 'changedby');
    }
}
