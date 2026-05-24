<?php

namespace App\Repositories\Eloquent;

use App\Models\RestaurantConfig;
use App\Repositories\Contracts\RestaurantConfigRepositoryInterface;
use Illuminate\Support\Collection;

class RestaurantConfigRepository extends BaseRepository implements RestaurantConfigRepositoryInterface
{
    public function __construct(RestaurantConfig $model)
    {
        parent::__construct($model);
    }

    public function getAllConfigs(): Collection
    {
        return $this->model->all();
    }

    public function setConfig(string $key, string $value): RestaurantConfig
    {
        return $this->model::setVal($key, $value);
    }
}
