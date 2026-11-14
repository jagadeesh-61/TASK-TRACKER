<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => rtrim(fake()->sentence(4), '.'),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(TaskStatus::cases()),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+1 month')?->format('Y-m-d'),
        ];
    }

    public function status(TaskStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
