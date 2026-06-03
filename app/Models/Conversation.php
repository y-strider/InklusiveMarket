<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Conversation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ulid', 'listing_id', 'order_id', 'subject', 'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Conversation $c) {
            if (empty($c->ulid)) {
                $c->ulid = Str::ulid()->toBase32();
            }
        });
    }

    // Relations
    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Helpers
    public function unreadCountFor(User $user): int
    {
        $participant = $this->participants->find($user->id);
        if (!$participant) return 0;
        $lastRead = $participant->pivot->last_read_at;
        return $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->when($lastRead, fn($q) => $q->where('created_at', '>', $lastRead))
            ->count();
    }

    public function otherParticipant(User $user): ?User
    {
        return $this->participants->firstWhere('id', '!=', $user->id);
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }
}
