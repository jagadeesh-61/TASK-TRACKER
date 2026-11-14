<?php

namespace App\Http\Resources;

use App\Enums\TaskStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Task
 */
class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'due_date' => $this->due_date?->toDateString(),
            'is_overdue' => $this->due_date !== null
                && $this->status !== TaskStatus::Completed
                && $this->due_date->lt(today()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'owner' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            // Lets the UI hide buttons. The backend still enforces every rule.
            'can' => [
                'update' => (bool) $user?->can('update', $this->resource),
                'delete' => (bool) $user?->can('delete', $this->resource),
            ],
        ];
    }
}
