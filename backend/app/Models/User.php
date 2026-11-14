<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    /**
     * 'role' is deliberately NOT fillable: a request body can never make
     * someone an admin through mass assignment.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $attributes = [
        'role' => 'user',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            // Hashed with bcrypt via password_hash() whenever it is set.
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }
}
