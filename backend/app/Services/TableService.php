<?php

namespace App\Services;

use App\Repositories\Contracts\TableRepositoryInterface;
use App\Models\Table;
use Illuminate\Database\Eloquent\Collection;

class TableService extends BaseService
{
    protected TableRepositoryInterface $tableRepository;

    public function __construct(TableRepositoryInterface $tableRepository)
    {
        $this->tableRepository = $tableRepository;
    }

    public function getAllTables(): Collection
    {
        return $this->tableRepository->all();
    }

    public function getTableById(int $id): ?Table
    {
        return $this->tableRepository->find($id);
    }

    public function createTable(array $data): Table
    {
        if (!isset($data['status'])) {
            $data['status'] = 'free';
        }

        /** @var Table */
        return $this->tableRepository->create($data);
    }

    public function updateTable(int $id, array $data): bool
    {
        return $this->tableRepository->update($id, $data);
    }

    public function deleteTable(int $id): bool
    {
        return $this->tableRepository->delete($id);
    }

    public function updateTableStatus(int $id, string $status): bool
    {
        return $this->tableRepository->updateStatus($id, $status);
    }
}
