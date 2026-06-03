<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ulid', 'conversation_id', 'sender_id', 'body', 'is_system', 'read_at',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'read_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Message $m) {
            if (empty($m->ulid)) {
                $m->ulid = Str::ulid()->toBase32();
            }
        });

        static::created(function (Message $m) {
            $m->conversation->update(['last_message_at' => now()]);
        });
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function isRead(): bool
    {
        return !is_null($this->read_at);
    }
}
