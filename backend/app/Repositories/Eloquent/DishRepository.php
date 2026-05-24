<?php

namespace App\Repositories\Eloquent;

use App\Models\Dish;
use App\Repositories\Contracts\DishRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DishRepository extends BaseRepository implements DishRepositoryInterface
{
    public function __construct(Dish $model)
    {
        parent::__construct($model);
    }

    public function allWithCategory(): Collection
    {
        return $this->model->with('category')->orderBy('name', 'asc')->get();
    }

    public function toggleAvailability(int $id): bool
    {
        $dish = $this->findOrFail($id);
        $dish->is_available = !$dish->is_available;
        return $dish->save();
    }
}
