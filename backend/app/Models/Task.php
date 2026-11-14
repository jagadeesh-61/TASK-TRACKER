<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    /**
     * 'user_id' is deliberately NOT fillable: the owner always comes from the
     * logged-in user, never from request data.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'due_date',
    ];

    protected $attributes = [
        'status' => 'Pending',
        'priority' => 'Medium',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_date' => 'date',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOwnedBy(User $user): bool
    {
        return (int) $this->user_id === (int) $user->getKey();
    }

    /**
     * Filter by title. The term is bound as a query parameter (prepared
     * statement); LIKE wildcards in it are escaped so "%" matches a literal "%".
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term !== '') {
            $escaped = addcslashes($term, '\\%_');
            if ($query->getConnection()->getDriverName() === 'sqlite') {
                $query->whereRaw("title LIKE ? ESCAPE '\\'", ['%'.$escaped.'%']);
            } else {
                $query->where('title', 'like', '%'.$escaped.'%');
            }
        }
    }

    public function scopeStatus(Builder $query, ?string $status): void
    {
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }
    }
}
