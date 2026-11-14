<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_user_can_create_a_task_with_valid_data(): void
    {
        $this->postJson('/api/tasks', ['title' => 'Write report', 'description' => 'Quarterly numbers'])
            ->assertCreated()
            ->assertJsonPath('message', 'Task added successfully.')
            ->assertJsonPath('data.title', 'Write report')
            ->assertJsonPath('data.status', 'Pending');

        $this->assertDatabaseHas('tasks', [
            'user_id' => $this->user->id,
            'title' => 'Write report',
            'status' => 'Pending',
        ]);
    }

    public function test_created_task_belongs_to_logged_in_user_even_if_user_id_is_sent(): void
    {
        $other = User::factory()->create();

        $this->postJson('/api/tasks', ['title' => 'Sneaky', 'user_id' => $other->id])
            ->assertCreated();

        $this->assertDatabaseHas('tasks', ['title' => 'Sneaky', 'user_id' => $this->user->id]);
        $this->assertDatabaseMissing('tasks', ['title' => 'Sneaky', 'user_id' => $other->id]);
    }

    public function test_user_can_list_their_tasks_newest_first(): void
    {
        $older = Task::factory()->for($this->user)->create(['created_at' => now()->subDay()]);
        $newer = Task::factory()->for($this->user)->create();

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_user_can_view_a_single_task(): void
    {
        $task = Task::factory()->for($this->user)->create();

        $this->getJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.can.update', true);
    }

    public function test_user_can_edit_title_and_description(): void
    {
        $task = Task::factory()->for($this->user)->create();

        $this->putJson("/api/tasks/{$task->id}", ['title' => 'New title', 'description' => 'New description'])
            ->assertOk()
            ->assertJsonPath('message', 'Task updated successfully.')
            ->assertJsonPath('data.title', 'New title');

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'New title', 'description' => 'New description']);
    }

    public function test_user_can_change_task_status(): void
    {
        $task = Task::factory()->for($this->user)->status(TaskStatus::Pending)->create();

        $this->patchJson("/api/tasks/{$task->id}/status", ['status' => 'In Progress'])
            ->assertOk()
            ->assertJsonPath('data.status', 'In Progress');

        $this->assertSame(TaskStatus::InProgress, $task->fresh()->status);
    }

    public function test_user_can_delete_a_task(): void
    {
        $task = Task::factory()->for($this->user)->create();

        $this->deleteJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Task deleted successfully.');

        $this->assertModelMissing($task);
    }

    public function test_missing_task_returns_404(): void
    {
        $this->getJson('/api/tasks/999999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_summary_counts_tasks_by_status(): void
    {
        Task::factory()->for($this->user)->count(2)->status(TaskStatus::Pending)->create();
        Task::factory()->for($this->user)->status(TaskStatus::InProgress)->create();
        Task::factory()->for($this->user)->count(3)->status(TaskStatus::Completed)->create();
        Task::factory()->count(4)->create(); // other users' tasks must not be counted

        $this->getJson('/api/tasks/summary')
            ->assertOk()
            ->assertExactJson(['data' => [
                'total' => 6,
                'pending' => 2,
                'in_progress' => 1,
                'completed' => 3,
            ]]);
    }

    public function test_list_is_paginated(): void
    {
        Task::factory()->for($this->user)->count(12)->create();

        $this->getJson('/api/tasks?per_page=5&page=3')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 3)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 12);
    }
}
