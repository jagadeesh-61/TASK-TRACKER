<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Database\Seeders\TaskSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_seeder_preserves_existing_demo_account_data(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'name' => 'Existing account name',
        ]);
        $passwordHash = $user->password;

        $this->seed(UserSeeder::class);

        $user->refresh();
        $this->assertSame('Existing account name', $user->name);
        $this->assertSame($passwordHash, $user->password);
    }

    public function test_task_seeder_preserves_existing_demo_account_tasks(): void
    {
        $this->seed(UserSeeder::class);

        $user = User::where('email', 'alice@example.com')->firstOrFail();
        $task = Task::factory()->for($user)->create(['title' => 'Existing personal task']);

        $this->seed(TaskSeeder::class);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'user_id' => $user->id,
            'title' => 'Existing personal task',
        ]);
    }
}
