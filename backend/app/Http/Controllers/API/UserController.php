<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
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
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $this->checkAdmin($request);
        $users = $this->userService->getAllUsers();
        
        $formatted = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->slug : null,
                'role_id' => $user->role_id,
                'created_at' => $user->created_at->toDateString(),
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        // FormRequest handles authorization check for admin role
        $validated = $request->validated();
        $user = $this->userService->createUser($validated);
        $user->load('role');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->slug : null,
            'role_id' => $user->role_id,
            'created_at' => $user->created_at->toDateString(),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $this->checkAdmin($request);
        $user = $this->userService->getUserById($id);
        
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }
        
        $user->load('role');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->slug : null,
            'role_id' => $user->role_id,
            'created_at' => $user->created_at->toDateString(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        // FormRequest handles authorization check for admin role
        $validated = $request->validated();

        // Self demotion prevention check
        if ($request->user()->id === $id && isset($validated['role_id']) && $request->user()->role_id !== (int)$validated['role_id']) {
            return response()->json(['message' => 'No puedes cambiar tu propio rol de usuario para evitar perder accesos administrativos.'], 400);
        }

        $updated = $this->userService->updateUser($id, $validated);

        if (!$updated) {
            return response()->json(['message' => 'No se pudo actualizar el usuario.'], 400);
        }

        $user = $this->userService->getUserById($id);
        $user->load('role');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? $user->role->slug : null,
            'role_id' => $user->role_id,
            'created_at' => $user->created_at->toDateString(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->checkAdmin($request);

        // Self deletion prevention check
        if ($request->user()->id === $id) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta de usuario.'], 400);
        }

        $deleted = $this->userService->deleteUser($id);
        
        if (!$deleted) {
            return response()->json(['message' => 'No se pudo eliminar el usuario.'], 400);
        }

        return response()->json(['message' => 'Usuario eliminado con éxito.']);
    }

    /**
     * Display all roles for dropdown selectors.
     */
    public function getRoles(Request $request): JsonResponse
    {
        $this->checkAdmin($request);
        $roles = Role::all(['id', 'name', 'slug']);
        return response()->json($roles);
    }
}
