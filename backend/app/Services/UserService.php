<?php

namespace App\Services;

use App\Repositories\Contracts\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    protected UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Get all users.
     */
    public function getAllUsers(): Collection
    {
        return $this->userRepository->allWithRole();
    }

    /**
     * Get user by ID.
     */
    public function getUserById(int $id): ?User
    {
        return $this->userRepository->find($id);
    }

    /**
     * Create new user.
     */
    public function createUser(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        
        /** @var User */
        return $this->userRepository->create($data);
    }

    /**
     * Update an existing user.
     */
    public function updateUser(int $id, array $data): bool
    {
        // Hash password if provided, otherwise remove it to avoid overwriting with null
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $this->userRepository->update($id, $data);
    }

    /**
     * Delete user by ID.
     */
    public function deleteUser(int $id): bool
    {
        return $this->userRepository->delete($id);
    }
}
