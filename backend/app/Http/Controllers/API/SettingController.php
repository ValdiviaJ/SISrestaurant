<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\RestaurantConfigService;
use App\Http\Requests\UpdateRestaurantConfigRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    protected RestaurantConfigService $settingService;

    public function __construct(RestaurantConfigService $settingService)
    {
        $this->settingService = $settingService;
    }

    /**
     * Helper to verify if the authenticated user is an admin.
     * Throws abort if not authorized.
     */
    private function checkAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            abort(response()->json(['message' => 'No autorizado. Se requieren permisos de administrador.'], 403));
        }
    }

    /**
     * Retrieve current settings.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $this->checkAdmin($request);
        $settings = $this->settingService->getSettings();
        return response()->json($settings);
    }

    /**
     * Update current settings.
     */
    public function updateSettings(UpdateRestaurantConfigRequest $request): JsonResponse
    {
        // UpdateRestaurantConfigRequest authorizes admin role
        $settings = $this->settingService->updateSettings($request->validated());
        return response()->json($settings);
    }
}
