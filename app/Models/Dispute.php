<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Dispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid', 'order_id', 'opened_by', 'reason', 'body',
        'status', 'resolved_by', 'resolved_at', 'resolution',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Dispute $d) {
            if (empty($d->ulid)) {
                $d->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function opener()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function disputeMessages()
    {
        return $this->hasMany(DisputeMessage::class)->orderBy('created_at');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'under_review']);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }
}
