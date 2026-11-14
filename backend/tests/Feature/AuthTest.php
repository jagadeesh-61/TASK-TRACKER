<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const VALID_REGISTRATION = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Secret123',
        'password_confirmation' => 'Secret123',
    ];

    public function test_user_can_register_and_is_logged_in(): void
    {
        $this->postJson('/api/register', self::VALID_REGISTRATION)
            ->assertCreated()
            ->assertJsonPath('data.email', 'test@example.com')
            ->assertJsonPath('data.role', 'user')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticated('web');
    }

    public function test_password_is_stored_as_a_bcrypt_hash(): void
    {
        $this->postJson('/api/register', self::VALID_REGISTRATION)->assertCreated();

        $stored = User::where('email', 'test@example.com')->value('password');

        $this->assertNotSame('Secret123', $stored);
        $this->assertStringStartsWith('$2y$', $stored);
        $this->assertTrue(password_verify('Secret123', $stored));
    }

    public function test_registration_cannot_set_role(): void
    {
        $this->postJson('/api/register', [...self::VALID_REGISTRATION, 'role' => 'admin'])
            ->assertCreated()
            ->assertJsonPath('data.role', 'user');

        $this->assertSame(UserRole::User, User::where('email', 'test@example.com')->first()->role);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $this->postJson('/api/register', self::VALID_REGISTRATION)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'An account with this email already exists.']);
    }

    public function test_registration_validates_required_fields_and_password_rules(): void
    {
        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_user_can_log_in_with_correct_credentials(): void
    {
        $user = User::factory()->create(['password' => Hash::make('Secret123')]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Secret123'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_login_fails_with_wrong_password_using_a_generic_message(): void
    {
        $user = User::factory()->create(['password' => Hash::make('Secret123')]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'WrongPass1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Invalid email or password.']);

        $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'WrongPass1'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Invalid email or password.']);

        $this->assertGuest('web');
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        $credentials = ['email' => 'nobody@example.com', 'password' => 'WrongPass1'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', $credentials)->assertUnprocessable();
        }

        $this->postJson('/api/login', $credentials)->assertTooManyRequests();
    }

    public function test_current_user_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();

        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_user_can_log_out(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertGuest('web');
    }
}
