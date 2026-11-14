<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $make = fn (string $title, TaskStatus $status) => Task::factory()
            ->for($this->user)->status($status)->create(['title' => $title]);

        $make('Prepare monthly report', TaskStatus::Pending);
        $make('Report bug in invoices', TaskStatus::Completed);
        $make('Book conference room', TaskStatus::Pending);
        $make('Discount 100% sale banner', TaskStatus::InProgress);
    }

    private function titles(string $query): array
    {
        return collect($this->getJson("/api/tasks?{$query}")->assertOk()->json('data'))
            ->pluck('title')->sort()->values()->all();
    }

    public function test_search_matches_titles_case_insensitively(): void
    {
        $this->assertSame(
            ['Prepare monthly report', 'Report bug in invoices'],
            $this->titles('search=REPORT')
        );
    }

    public function test_status_filter_returns_only_that_status(): void
    {
        $this->assertSame(
            ['Book conference room', 'Prepare monthly report'],
            $this->titles('status=Pending')
        );
    }

    public function test_search_and_status_filter_can_be_combined(): void
    {
        $this->assertSame(
            ['Report bug in invoices'],
            $this->titles('search=report&status=Completed')
        );
    }

    public function test_search_never_returns_other_users_tasks(): void
    {
        Task::factory()->create(['title' => 'Prepare monthly report (someone else)']);

        $this->assertSame(['Prepare monthly report'], $this->titles('search=monthly'));
    }

    public function test_like_wildcards_in_search_are_treated_literally(): void
    {
        $this->assertSame(['Discount 100% sale banner'], $this->titles('search='.urlencode('100%')));
        $this->assertSame([], $this->titles('search='.urlencode('%%')));
    }

    public function test_sql_injection_attempt_is_treated_as_plain_text(): void
    {
        $this->assertSame([], $this->titles('search='.urlencode("' OR 1=1 --")));
        $this->assertDatabaseCount('tasks', 4);
    }
}
