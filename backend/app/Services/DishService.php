<?php

namespace App\Services;

use App\Repositories\Contracts\DishRepositoryInterface;
use App\Models\Dish;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DishService extends BaseService
{
    protected DishRepositoryInterface $dishRepository;

    public function __construct(DishRepositoryInterface $dishRepository)
    {
        $this->dishRepository = $dishRepository;
    }

    public function getAllDishes(): Collection
    {
        return $this->dishRepository->allWithCategory();
    }

    public function getDishById(int $id): ?Dish
    {
        return $this->dishRepository->find($id);
    }

    public function createDish(array $data, ?UploadedFile $imageFile = null): Dish
    {
        if ($imageFile) {
            $data['image_url'] = $this->uploadImage($imageFile);
        }

        /** @var Dish */
        return $this->dishRepository->create($data);
    }

    public function updateDish(int $id, array $data, ?UploadedFile $imageFile = null): bool
    {
        $dish = $this->dishRepository->findOrFail($id);

        if ($imageFile) {
            // Delete old image if it was uploaded locally
            if ($dish->image_url) {
                $this->deleteOldUploadedImage($dish->image_url);
            }
            $data['image_url'] = $this->uploadImage($imageFile);
        }

        return $this->dishRepository->update($id, $data);
    }

    public function deleteDish(int $id): bool
    {
        $dish = $this->dishRepository->findOrFail($id);
        if ($dish->image_url) {
            $this->deleteOldUploadedImage($dish->image_url);
        }
        return $this->dishRepository->delete($id);
    }

    public function toggleAvailability(int $id): bool
    {
        return $this->dishRepository->toggleAvailability($id);
    }

    /**
     * Upload dish image to public storage.
     */
    protected function uploadImage(UploadedFile $file): string
    {
        $path = $file->store('dishes', 'public');
        return asset('storage/' . $path);
    }

    /**
     * Delete previous uploaded image from storage.
     */
    protected function deleteOldUploadedImage(string $imageUrl): void
    {
        // Extract relative path from absolute public asset URL
        $storagePrefix = asset('storage/');
        if (str_starts_with($imageUrl, $storagePrefix)) {
            $relativePath = str_replace($storagePrefix, '', $imageUrl);
            Storage::disk('public')->delete($relativePath);
        }
    }
}
