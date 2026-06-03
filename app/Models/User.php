<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Scout\Searchable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, LogsActivity, Searchable;

    protected $fillable = [
        'ulid','username','displayname','email','password',
        'avatarurl','bio','location','websiteurl','pronouns',
        'isseller','selleronboardedat','stripeaccountid','stripecustomerid',
        'issuspended','suspensionreason','suspendedat','lastseenat','emailverifiedat',
    ];

    protected $hidden = ['password','remember_token','stripeaccountid','stripecustomerid'];

    protected $casts = [
        'emailverifiedat' => 'datetime',
        'selleronboardedat' => 'datetime',
        'suspendedat' => 'datetime',
        'lastseenat' => 'datetime',
        'isseller' => 'boolean',
        'issuspended' => 'boolean',
        'password' => 'hashed',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->ulid)) {
                $user->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['email','isseller','issuspended'])->logOnlyDirty();
    }

    public function toSearchableArray(): array
    {
        return [
            'id'=>$this->id,
            'ulid'=>$this->ulid,
            'username'=>$this->username,
            'displayname'=>$this->displayname,
            'bio'=>$this->bio,
            'location'=>$this->location,
            'isseller'=>$this->isseller,
        ];
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'roleuser')
            ->withPivot('assignedat','assignedby')
            ->withTimestamps();
    }

    public function listings()
    {
        return $this->hasMany(Listing::class, 'sellerid');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'buyerid');
    }

    public function sellerOrders()
    {
        return $this->hasMany(Order::class, 'sellerid');
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoritedListings()
    {
        return $this->belongsToMany(Listing::class, 'favorites')->withTimestamps();
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversationparticipants')
            ->withPivot('lastreadat')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'senderid');
    }

    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewerid');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'revieweeid');
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'buyerid');
    }

    public function sellerOffers()
    {
        return $this->hasMany(Offer::class, 'sellerid');
    }

    public function payouts()
    {
        return $this->hasMany(Payout::class, 'sellerid');
    }

    public function shippingProfiles()
    {
        return $this->hasMany(ShippingProfile::class, 'sellerid');
    }

    public function disputes()
    {
        return $this->hasMany(Dispute::class, 'openedby');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'reporterid');
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    public function hasAnyRole(array $roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->hasRole('superadmin')) return true;
        return $this->roles->flatMap->permissions->contains('name', $permission);
    }

    public function assignRole(string $roleName, ?int $assignedBy = null): void
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $this->roles()->syncWithoutDetaching([
            $role->id => ['assignedat' => now(), 'assignedby' => $assignedBy],
        ]);
    }

    public function isSeller(): bool
    {
        return (bool)$this->isseller && $this->hasRole('seller');
    }

    public function isSellerOnboarded(): bool
    {
        return $this->isSeller() && !empty($this->stripeaccountid) && !empty($this->selleronboardedat);
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['admin','superadmin']);
    }

    public function isModerator(): bool
    {
        return $this->hasAnyRole(['moderator','admin','superadmin']);
    }

    public function isSuspended(): bool
    {
        return (bool)$this->issuspended;
    }

    public function averageRating(): float
    {
        return round($this->reviewsReceived()->where('ispublished', true)->avg('rating') ?? 0, 1);
    }

    public function reviewCount(): int
    {
        return $this->reviewsReceived()->where('ispublished', true)->count();
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }
}
