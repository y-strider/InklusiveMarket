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
        'ulid','conversationid','senderid','body','issystem','readat',
    ];

    protected $casts = [
        'issystem' => 'boolean',
        'readat' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Message $m) {
            if (empty($m->ulid)) {
                $m->ulid = Str::ulid()->toBase32();
            }
        });

        static::created(function (Message $m) {
            if ($m->conversation) {
                $m->conversation->update(['lastmessageat' => now()]);
            }
        });
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversationid');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'senderid');
    }

    public function isRead(): bool
    {
        return !isnull($this->readat);
    }
}
