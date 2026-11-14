<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_empty_title_is_rejected(): void
    {
        $this->postJson('/api/tasks', ['title' => '', 'description' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'Please enter a task title.']);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_whitespace_only_title_is_rejected(): void
    {
        $this->postJson('/api/tasks', ['title' => '     '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_title_longer_than_150_characters_is_rejected(): void
    {
        $this->postJson('/api/tasks', ['title' => str_repeat('a', 151)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'The title must be 150 characters or fewer.']);
    }

    public function test_invalid_status_is_rejected_on_create_and_on_status_change(): void
    {
        $this->postJson('/api/tasks', ['title' => 'Valid', 'status' => 'Done'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $task = Task::factory()->for($this->user)->create();

        $this->patchJson("/api/tasks/{$task->id}/status", ['status' => 'Archived'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_also_requires_a_title(): void
    {
        $task = Task::factory()->for($this->user)->create(['title' => 'Original']);

        $this->putJson("/api/tasks/{$task->id}", ['title' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);

        $this->assertSame('Original', $task->fresh()->title);
    }

    public function test_due_date_cannot_be_in_the_past_for_new_tasks(): void
    {
        $this->postJson('/api/tasks', ['title' => 'Late', 'due_date' => now()->subDay()->toDateString()])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['due_date' => 'The due date cannot be in the past.']);
    }

    public function test_invalid_status_filter_is_rejected(): void
    {
        $this->getJson('/api/tasks?status=Unknown')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }
}
