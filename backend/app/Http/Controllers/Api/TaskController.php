<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\TaskIndexRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    /**
     * GET /api/tasks?search=&status=&page=&per_page=&scope=all
     */
    public function index(TaskIndexRequest $request): AnonymousResourceCollection
    {
        $tasks = $this->visibleTasks($request)
            ->search($request->validated('search'))
            ->status($request->validated('status'))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return TaskResource::collection($tasks);
    }

    /**
     * GET /api/tasks/summary  (bonus: dashboard counts)
     */
    public function summary(TaskIndexRequest $request): JsonResponse
    {
        $counts = $this->visibleTasks($request)
            ->toBase()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $count = fn (TaskStatus $status) => (int) ($counts[$status->value] ?? 0);

        return response()->json(['data' => [
            'total' => (int) $counts->sum(),
            'pending' => $count(TaskStatus::Pending),
            'in_progress' => $count(TaskStatus::InProgress),
            'completed' => $count(TaskStatus::Completed),
        ]]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        // Owner comes from the session, never from the request body.
        $task = $request->user()->tasks()->create($request->validated());

        return (new TaskResource($task))
            ->additional(['message' => 'Task added successfully.'])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        Gate::authorize('view', $task);

        return new TaskResource($task->load('user:id,name'));
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        Gate::authorize('update', $task);

        $task->update($request->validated());

        return (new TaskResource($task))
            ->additional(['message' => 'Task updated successfully.']);
    }

    /**
     * PATCH /api/tasks/{task}/status
     */
    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): TaskResource
    {
        Gate::authorize('update', $task);

        $task->update(['status' => $request->validated('status')]);

        return (new TaskResource($task))
            ->additional(['message' => "Status changed to {$task->status->value}."]);
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return response()->json(['message' => 'Task deleted successfully.']);
    }

    /**
     * Normal users only ever see their own tasks. "scope=all" is honoured for
     * admins only; anyone else gets 403.
     *
     * @return Builder<Task>|HasMany<Task, \App\Models\User>
     */
    private function visibleTasks(TaskIndexRequest $request): Builder|HasMany
    {
        if ($request->wantsAllUsers()) {
            Gate::authorize('viewAll', Task::class);

            return Task::query()->with('user:id,name');
        }

        return $request->user()->tasks();
    }
}
