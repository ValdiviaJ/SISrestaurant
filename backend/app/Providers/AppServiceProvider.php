<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Eloquent\OrderRepository;

use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(\App\Repositories\Contracts\CategoryRepositoryInterface::class, \App\Repositories\Eloquent\CategoryRepository::class);
        $this->app->bind(\App\Repositories\Contracts\DishRepositoryInterface::class, \App\Repositories\Eloquent\DishRepository::class);
        $this->app->bind(\App\Repositories\Contracts\TableRepositoryInterface::class, \App\Repositories\Eloquent\TableRepository::class);
        $this->app->bind(\App\Repositories\Contracts\ReportRepositoryInterface::class, \App\Repositories\Eloquent\ReportRepository::class);
        $this->app->bind(\App\Repositories\Contracts\UserRepositoryInterface::class, \App\Repositories\Eloquent\UserRepository::class);
        $this->app->bind(\App\Repositories\Contracts\RestaurantConfigRepositoryInterface::class, \App\Repositories\Eloquent\RestaurantConfigRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
