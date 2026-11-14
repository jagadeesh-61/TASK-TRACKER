<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'app' => config('app.name'),
    'message' => 'Task Tracker API. See /api/health.',
]));
