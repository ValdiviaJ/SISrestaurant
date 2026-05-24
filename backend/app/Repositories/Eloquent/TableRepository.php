<?php

namespace App\Repositories\Eloquent;

use App\Models\Table;
use App\Repositories\Contracts\TableRepositoryInterface;

class TableRepository extends BaseRepository implements TableRepositoryInterface
{
    public function __construct(Table $model)
    {
        parent::__construct($model);
    }

    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, ['status' => $status]);
    }
}
