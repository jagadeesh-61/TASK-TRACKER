<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Authorization rules for tasks:
 *
 *  - user:  full access to their own tasks; other users' tasks are invisible (404).
 *  - admin: same as user for their own tasks, plus read-only access to every
 *           user's tasks. Admins cannot change tasks they do not own (403).
 */
class TaskPolicy
{
    private const NOT_FOUND = 'Resource not found.';

    public function viewAll(User $user): Response
    {
        return $user->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can view all users\' tasks.');
    }

    public function view(User $user, Task $task): Response
    {
        return $task->isOwnedBy($user) || $user->isAdmin()
            ? Response::allow()
            : Response::denyAsNotFound(self::NOT_FOUND);
    }

    public function update(User $user, Task $task): Response
    {
        return $this->ownerOnly($user, $task);
    }

    public function delete(User $user, Task $task): Response
    {
        return $this->ownerOnly($user, $task);
    }

    private function ownerOnly(User $user, Task $task): Response
    {
        if ($task->isOwnedBy($user)) {
            return Response::allow();
        }

        // An admin already knows the task exists (they can view it), so a
        // clear 403 is fine. Anyone else gets the same 404 as a missing task.
        return $user->isAdmin()
            ? Response::deny('Administrators can view other users\' tasks but cannot change them.')
            : Response::denyAsNotFound(self::NOT_FOUND);
    }
}
