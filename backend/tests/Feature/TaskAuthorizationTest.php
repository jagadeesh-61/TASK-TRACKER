<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $alice;

    private User $bob;

    private User $admin;

    private Task $bobsTask;

    protected function setUp(): void
    {
        parent::setUp();

        $this->alice = User::factory()->create();
        $this->bob = User::factory()->create();
        $this->admin = User::factory()->admin()->create();

        $this->bobsTask = Task::factory()->for($this->bob)
            ->status(TaskStatus::Pending)
            ->create(['title' => 'Bob private task']);
    }

    public function test_guest_cannot_access_any_task_endpoint(): void
    {
        $id = $this->bobsTask->id;

        $this->getJson('/api/tasks')->assertUnauthorized();
        $this->getJson('/api/tasks/summary')->assertUnauthorized();
        $this->getJson("/api/tasks/{$id}")->assertUnauthorized();
        $this->postJson('/api/tasks', ['title' => 'x'])->assertUnauthorized();
        $this->putJson("/api/tasks/{$id}", ['title' => 'x'])->assertUnauthorized();
        $this->patchJson("/api/tasks/{$id}/status", ['status' => 'Completed'])->assertUnauthorized();
        $this->deleteJson("/api/tasks/{$id}")->assertUnauthorized();
    }

    public function test_user_only_sees_their_own_tasks_in_the_list(): void
    {
        Task::factory()->for($this->alice)->create(['title' => 'Alice task']);

        $this->actingAs($this->alice)->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Alice task');
    }

    public function test_user_cannot_view_another_users_task_by_id(): void
    {
        $this->actingAs($this->alice)
            ->getJson("/api/tasks/{$this->bobsTask->id}")
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_user_cannot_update_another_users_task(): void
    {
        $this->actingAs($this->alice)
            ->putJson("/api/tasks/{$this->bobsTask->id}", ['title' => 'Hacked'])
            ->assertNotFound();

        $this->assertSame('Bob private task', $this->bobsTask->fresh()->title);
    }

    public function test_user_cannot_change_status_of_another_users_task(): void
    {
        $this->actingAs($this->alice)
            ->patchJson("/api/tasks/{$this->bobsTask->id}/status", ['status' => 'Completed'])
            ->assertNotFound();

        $this->assertSame(TaskStatus::Pending, $this->bobsTask->fresh()->status);
    }

    public function test_user_cannot_delete_another_users_task(): void
    {
        $this->actingAs($this->alice)
            ->deleteJson("/api/tasks/{$this->bobsTask->id}")
            ->assertNotFound();

        $this->assertModelExists($this->bobsTask);
    }

    public function test_normal_user_cannot_request_all_users_tasks(): void
    {
        $this->actingAs($this->alice)->getJson('/api/tasks?scope=all')->assertForbidden();
        $this->actingAs($this->alice)->getJson('/api/tasks/summary?scope=all')->assertForbidden();
    }

    public function test_admin_can_view_all_users_tasks_with_owner_names(): void
    {
        Task::factory()->for($this->alice)->create();

        $this->actingAs($this->admin)->getJson('/api/tasks?scope=all')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [['owner' => ['id', 'name']]]]);
    }

    public function test_admin_can_view_another_users_task_but_not_modify_it(): void
    {
        $id = $this->bobsTask->id;

        $this->actingAs($this->admin)->getJson("/api/tasks/{$id}")
            ->assertOk()
            ->assertJsonPath('data.can.update', false)
            ->assertJsonPath('data.can.delete', false);

        $this->actingAs($this->admin)->putJson("/api/tasks/{$id}", ['title' => 'Changed'])->assertForbidden();
        $this->actingAs($this->admin)->patchJson("/api/tasks/{$id}/status", ['status' => 'Completed'])->assertForbidden();
        $this->actingAs($this->admin)->deleteJson("/api/tasks/{$id}")->assertForbidden();

        $this->assertSame('Bob private task', $this->bobsTask->fresh()->title);
    }

    public function test_admin_list_without_scope_shows_only_their_own_tasks(): void
    {
        Task::factory()->for($this->admin)->create(['title' => 'Admin task']);

        $this->actingAs($this->admin)->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Admin task');
    }
}
