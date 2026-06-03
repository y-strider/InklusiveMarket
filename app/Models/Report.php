<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid', 'reporter_id', 'reportable_type', 'reportable_id',
        'reason', 'body', 'status', 'reviewed_by', 'reviewed_at', 'resolution_note',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Report $r) {
            if (empty($r->ulid)) {
                $r->ulid = Str::ulid()->toBase32();
            }
        });
    }

    public function reportable()
    {
        return $this->morphTo();
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
