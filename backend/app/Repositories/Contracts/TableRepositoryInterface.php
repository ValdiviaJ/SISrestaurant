<?php

namespace App\Repositories\Contracts;

interface TableRepositoryInterface extends RepositoryInterface
{
    public function updateStatus(int $id, string $status): bool;
}
