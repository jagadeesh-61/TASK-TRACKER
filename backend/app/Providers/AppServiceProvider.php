<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Outside production, fail loudly on lazy loading and on attributes that
        // are silently dropped by mass assignment (e.g. someone sending user_id).
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
