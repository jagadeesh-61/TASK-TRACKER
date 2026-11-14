<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    // Who may perform the action is decided by TaskPolicy in the controller.
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Laravel's TrimStrings middleware runs first, so a title of only spaces
     * arrives as an empty string and fails "required".
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Please enter a task title.',
            'title.max' => 'The title must be 150 characters or fewer.',
            'description.max' => 'The description must be 2000 characters or fewer.',
            'status.enum' => 'Please choose a valid status: Pending, In Progress or Completed.',
            'priority.enum' => 'Please choose a valid priority: Low, Medium or High.',
            'due_date.date_format' => 'The due date must be a valid date (YYYY-MM-DD).',
            'due_date.after_or_equal' => 'The due date cannot be in the past.',
        ];
    }
}
