<?php

namespace App\Repositories\Contracts;

use App\Models\RestaurantConfig;
use Illuminate\Support\Collection;

interface RestaurantConfigRepositoryInterface extends RepositoryInterface
{
    public function getAllConfigs(): Collection;
    public function setConfig(string $key, string $value): RestaurantConfig;
}
