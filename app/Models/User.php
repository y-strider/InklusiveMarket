<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Scout\Searchable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, LogsActivity;

    protected $fillable = [
        'ulid', 'username', 'display_name', 'email', 'password',
        'avatar_url', 'bio', 'location', 'website_url', 'pronouns',
        'is_seller', 'seller_onboarded_at', 'stripe_account_id', 'stripe_customer_id',
        'is_suspended', 'suspension_reason', 'suspended_at', 'last_seen_at',
    ];

    protected $hidden = ['password', 'remember_token', 'stripe_account_id', 'stripe_customer_id'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'seller_onboarded_at' => 'datetime',
        'suspended_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'is_seller' => 'boolean',
        'is_suspended' => 'boolean',
        'password' => 'hashed',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->ulid)) {
                $user->ulid = \Str::ulid()->toBase32();
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['email', 'is_seller', 'is_suspended'])->logOnlyDirty();
    }

    // Relations
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user')
            ->withPivot('assigned_at', 'assigned_by')
            ->withTimestamps();
    }

    public function listings()
    {
        return $this->hasMany(Listing::class, 'seller_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    public function sellerOrders()
    {
        return $this->hasMany(Order::class, 'seller_id');
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
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'reviewee_id');
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'buyer_id');
    }

    public function sellerOffers()
    {
        return $this->hasMany(Offer::class, 'seller_id');
    }

    public function payouts()
    {
        return $this->hasMany(Payout::class, 'seller_id');
    }

    public function shippingProfiles()
    {
        return $this->hasMany(ShippingProfile::class, 'seller_id');
    }

    public function disputes()
    {
        return $this->hasMany(Dispute::class, 'opened_by');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    // Helpers
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
            $role->id => ['assigned_at' => now(), 'assigned_by' => $assignedBy],
        ]);
    }

    public function isSeller(): bool
    {
        return $this->is_seller && $this->hasRole('seller');
    }

    public function isSellerOnboarded(): bool
    {
        return $this->isSeller() && !empty($this->stripe_account_id) && !empty($this->seller_onboarded_at);
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['admin', 'superadmin']);
    }

    public function isModerator(): bool
    {
        return $this->hasAnyRole(['moderator', 'admin', 'superadmin']);
    }

    public function isSuspended(): bool
    {
        return (bool) $this->is_suspended;
    }

    public function averageRating(): float
    {
        return round($this->reviewsReceived()->where('is_published', true)->avg('rating') ?? 0, 1);
    }

    public function reviewCount(): int
    {
        return $this->reviewsReceived()->where('is_published', true)->count();
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }
}
