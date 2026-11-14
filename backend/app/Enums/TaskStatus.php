<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Pending = 'Pending';
    case InProgress = 'In Progress';
    case Completed = 'Completed';
}
