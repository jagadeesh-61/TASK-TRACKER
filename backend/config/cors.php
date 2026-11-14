<?php

// In development the Vite proxy makes React and the API same-origin, so CORS is
// not involved. These settings apply when the frontend is served from a
// different origin (FRONTEND_URL, comma-separated for several).

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Required so the browser sends the session cookie cross-origin.
    'supports_credentials' => true,

];
