<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Behave like the React SPA: Sanctum treats requests from a stateful
        // origin as session-based, which login/logout need.
        $this->withHeader('Origin', 'http://localhost');
    }
}
