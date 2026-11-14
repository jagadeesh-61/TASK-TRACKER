<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        // The "hashed" cast stores password_hash() output, never the plain text.
        $user = User::create($request->safe()->only(['name', 'email', 'password']));

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))
            ->additional(['message' => 'Account created. Welcome!'])
            ->response()
            ->setStatusCode(201);
    }

    public function login(LoginRequest $request): UserResource
    {
        // attempt() checks the password with password_verify() under the hood.
        if (! Auth::guard('web')->attempt($request->validated())) {
            // Same message for unknown email and wrong password, so the
            // response does not reveal which emails are registered.
            throw ValidationException::withMessages([
                'email' => 'Invalid email or password.',
            ]);
        }

        // New session id after login prevents session fixation.
        $request->session()->regenerate();

        return (new UserResource(Auth::guard('web')->user()))
            ->additional(['message' => 'Logged in successfully.']);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
