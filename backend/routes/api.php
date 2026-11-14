<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// GET /sanctum/csrf-cookie is registered by Sanctum itself.

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Public auth endpoints: max 5 attempts per minute per IP (brute-force protection).
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Registered before apiResource so "summary" is not treated as a task id.
    Route::get('/tasks/summary', [TaskController::class, 'summary']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::apiResource('tasks', TaskController::class);
});
