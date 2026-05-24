<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface extends RepositoryInterface
{
    /**
     * Get all users with their roles eager loaded.
     */
    public function allWithRole(): Collection;
}
