<?php

namespace App\Http\Requests;

class UpdateTaskRequest extends StoreTaskRequest
{
    public function rules(): array
    {
        // An existing task may keep a due date that has since passed.
        return [
            ...parent::rules(),
            'due_date' => ['nullable', 'date_format:Y-m-d'],
        ];
    }
}
