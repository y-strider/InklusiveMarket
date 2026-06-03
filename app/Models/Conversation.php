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
        'ulid','listingid','orderid','subject','lastmessageat',
    ];

    protected $casts = [
        'lastmessageat' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Conversation $c) {
            if (empty($c->ulid)) {
                $c->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversationparticipants', 'conversationid', 'userid')
            ->withPivot('lastreadat')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'conversationid')->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class, 'conversationid')->latestOfMany();
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class)->withTrashed();
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function unreadCountFor(User $user): int
    {
        $participant = $this->participants->firstWhere('id', $user->id);
        if (!$participant) return 0;
        $lastRead = $participant->pivot->lastreadat;
        return $this->messages()
            ->where('senderid', '!=', $user->id)
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
