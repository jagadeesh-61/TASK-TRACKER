<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Requests from the React origin (SANCTUM_STATEFUL_DOMAINS) get session
        // cookies + CSRF verification on the API routes.
        $middleware->statefulApi();

        // This is a JSON API: there is no login page to redirect guests to.
        $middleware->redirectGuestsTo('/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always answer API requests with JSON (401, 403, 404, 419, 422, 429, 500).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        // One identical 404 message for "does not exist" and "belongs to someone
        // else", so the API never reveals whether another user's task exists.
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($e->getStatusCode() === 404 && $request->is('api/*')) {
                return response()->json(['message' => 'Resource not found.'], 404);
            }
        });
    })->create();
