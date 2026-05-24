<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface DishRepositoryInterface extends RepositoryInterface
{
    public function allWithCategory(): Collection;

    public function toggleAvailability(int $id): bool;
}
