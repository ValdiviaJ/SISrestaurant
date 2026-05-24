<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Http\Controllers\API\UserController;
use Illuminate\Http\Request;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

echo "=========================================================\n";
echo "RESTOSUITE - USER MANAGEMENT MODULE VERIFICATION SCRIPT\n";
echo "=========================================================\n\n";

// 1. Fetch Seeded Users
$admin = User::where('email', 'admin@restosuite.com')->first();
$mozo = User::where('email', 'mozo@restosuite.com')->first();
$cajero = User::where('email', 'cajero@restosuite.com')->first();

if (!$admin || !$mozo || !$cajero) {
    echo "ERROR: Seeded users (admin, mozo, cajero) not found! Please seed the database first.\n";
    exit(1);
}

echo "Found Users:\n";
echo " - Admin: {$admin->name} (Role ID: {$admin->role_id}, Role Slug: {$admin->role->slug})\n";
echo " - Mozo: {$mozo->name} (Role ID: {$mozo->role_id}, Role Slug: {$mozo->role->slug})\n";
echo " - Cajero: {$cajero->name} (Role ID: {$cajero->role_id}, Role Slug: {$cajero->role->slug})\n\n";

$controller = app(UserController::class);

// Helper function to simulate a Request with a specific user
function createMockRequest($user, $method = 'GET', $data = [], $routeParameters = []) {
    $request = Request::create('/api/users', $method, $data);
    $request->setUserResolver(function () use ($user) {
        return $user;
    });
    // Set route parameters if needed (e.g. for update/show/delete)
    if (!empty($routeParameters)) {
        $request->setRouteResolver(function () use ($routeParameters) {
            $route = new \Illuminate\Routing\Route('PUT', '/api/users/{user}', []);
            $route->parameters = $routeParameters;
            return $route;
        });
    }
    return $request;
}

// 2. SECURITY TEST: Non-admin users should get 403 Forbidden
echo "---------------------------------------------------------\n";
echo "SECURITY TEST: Access Control (Expect 403 for Non-Admins)\n";
echo "---------------------------------------------------------\n";

try {
    $reqMozoIndex = createMockRequest($mozo);
    $controller->index($reqMozoIndex);
    echo " - Index: FAIL (Expected 403)\n";
} catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
    $res = $e->getResponse();
    echo " - Index: OK (Returned {$res->getStatusCode()} - " . $res->getContent() . ")\n";
} catch (\Throwable $e) {
    echo " - Index: FAIL (Unexpected exception: " . $e->getMessage() . ")\n";
}

try {
    $reqMozoRoles = createMockRequest($mozo);
    $controller->getRoles($reqMozoRoles);
    echo " - Get Roles: FAIL (Expected 403)\n";
} catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
    $res = $e->getResponse();
    echo " - Get Roles: OK (Returned {$res->getStatusCode()} - " . $res->getContent() . ")\n";
} catch (\Throwable $e) {
    echo " - Get Roles: FAIL (Unexpected exception: " . $e->getMessage() . ")\n";
}

try {
    $reqMozoDestroy = createMockRequest($mozo, 'DELETE');
    $controller->destroy($reqMozoDestroy, $admin->id);
    echo " - Destroy: FAIL (Expected 403)\n";
} catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
    $res = $e->getResponse();
    echo " - Destroy: OK (Returned {$res->getStatusCode()} - " . $res->getContent() . ")\n";
} catch (\Throwable $e) {
    echo " - Destroy: FAIL (Unexpected exception: " . $e->getMessage() . ")\n";
}


// 3. ADMIN CRUD FLOWS
echo "\n---------------------------------------------------------\n";
echo "ADMIN CRUD TEST: Testing full user life-cycle (Admin)\n";
echo "---------------------------------------------------------\n";

// Get available roles
$reqRoles = createMockRequest($admin);
$rolesRes = $controller->getRoles($reqRoles);
echo "Fetched Roles successfully: " . $rolesRes->getContent() . "\n\n";

$rolesData = json_decode($rolesRes->getContent(), true);
$cajeroRoleId = null;
$mozoRoleId = null;
foreach ($rolesData as $r) {
    if ($r['slug'] === 'cajero') $cajeroRoleId = $r['id'];
    if ($r['slug'] === 'mozo') $mozoRoleId = $r['id'];
}

if (!$cajeroRoleId || !$mozoRoleId) {
    echo "ERROR: Cajero or Mozo roles not found in DB roles list.\n";
    exit(1);
}

// A. Create User
echo "A. Creating a new Cajero user...\n";
$newUserData = [
    'name' => 'Temp Cashier User',
    'email' => 'tempcashier@restosuite.com',
    'password' => 'supersecretpassword123',
    'role_id' => $cajeroRoleId,
];

// In testing, FormRequests validation has to be manually resolved or we bypass it by calling validation directly 
// or using a resolved StoreUserRequest. Let's create and validate the request.
$storeRequest = StoreUserRequest::create('/api/users', 'POST', $newUserData);
$storeRequest->setUserResolver(function () use ($admin) {
    return $admin;
});
// Boot request validator
$storeRequest->setContainer($app);
$storeRequest->setRedirector($app->make(\Illuminate\Routing\Redirector::class));
$storeRequest->validateResolved(); // This runs authorize() & rules()

$createRes = $controller->store($storeRequest);
echo " - Store status: " . $createRes->getStatusCode() . "\n";
echo " - Created user data: " . $createRes->getContent() . "\n";

$createdUser = json_decode($createRes->getContent(), true);
$createdUserId = $createdUser['id'];

// B. Show User
echo "\nB. Fetching created user detail...\n";
$showReq = createMockRequest($admin);
$showRes = $controller->show($showReq, $createdUserId);
echo " - Show status: " . $showRes->getStatusCode() . "\n";
echo " - User detail: " . $showRes->getContent() . "\n";

// C. Update User (Name & Role changed to Mozo)
echo "\nC. Updating created user (role to Mozo, name to Updated)...\n";
$updateData = [
    'name' => 'Temp Cashier Updated',
    'email' => 'tempcashier@restosuite.com', // same email
    'role_id' => $mozoRoleId,
];

$updateRequest = UpdateUserRequest::create('/api/users/' . $createdUserId, 'PUT', $updateData);
$updateRequest->setUserResolver(function () use ($admin) {
    return $admin;
});
$updateRequest->setContainer($app);
$updateRequest->setRedirector($app->make(\Illuminate\Routing\Redirector::class));
// We pass the user parameter so route('user') returns the ID or object
$updateRequest->setRouteResolver(function () use ($createdUserId) {
    $route = new \Illuminate\Routing\Route('PUT', '/api/users/{user}', []);
    $route->parameters = ['user' => $createdUserId];
    return $route;
});
$updateRequest->validateResolved();

$updateRes = $controller->update($updateRequest, $createdUserId);
echo " - Update status: " . $updateRes->getStatusCode() . "\n";
echo " - Updated user: " . $updateRes->getContent() . "\n";


// D. Index Users (Check if updated user is in list)
echo "\nD. Checking index list for updated user...\n";
$indexReq = createMockRequest($admin);
$indexRes = $controller->index($indexReq);
$indexData = json_decode($indexRes->getContent(), true);
$found = false;
foreach ($indexData as $u) {
    if ($u['id'] === $createdUserId) {
        $found = true;
        echo " - Found in index! Name: {$u['name']}, Role: {$u['role']}\n";
    }
}
if (!$found) {
    echo " - FAIL: Created user not found in index!\n";
}


// E. Self-deletion Protection
echo "\nE. Testing self-deletion blocker (Admin trying to delete admin self)...\n";
$selfDeleteReq = createMockRequest($admin, 'DELETE');
$selfDeleteRes = $controller->destroy($selfDeleteReq, $admin->id);
echo " - Destroy Self status: " . $selfDeleteRes->getStatusCode() . "\n";
echo " - Destroy Self response: " . $selfDeleteRes->getContent() . "\n";

if ($selfDeleteRes->getStatusCode() === 400) {
    echo " - OK: Self-deletion was successfully blocked!\n";
} else {
    echo " - FAIL: Self-deletion returned status " . $selfDeleteRes->getStatusCode() . "\n";
}


// E2. Self-demotion Protection
echo "\nE2. Testing self-demotion blocker (Admin trying to demote self to Cajero)...\n";
$selfDemoteData = [
    'name' => $admin->name,
    'email' => $admin->email,
    'role_id' => $cajeroRoleId,
];
$selfDemoteRequest = UpdateUserRequest::create('/api/users/' . $admin->id, 'PUT', $selfDemoteData);
$selfDemoteRequest->setUserResolver(function () use ($admin) {
    return $admin;
});
$selfDemoteRequest->setContainer($app);
$selfDemoteRequest->setRedirector($app->make(\Illuminate\Routing\Redirector::class));
$selfDemoteRequest->setRouteResolver(function () use ($admin) {
    $route = new \Illuminate\Routing\Route('PUT', '/api/users/{user}', []);
    $route->parameters = ['user' => $admin->id];
    return $route;
});
$selfDemoteRequest->validateResolved();

try {
    $selfDemoteRes = $controller->update($selfDemoteRequest, $admin->id);
    echo " - Update Self Role status: " . $selfDemoteRes->getStatusCode() . "\n";
    echo " - Update Self Role response: " . $selfDemoteRes->getContent() . "\n";
    if ($selfDemoteRes->getStatusCode() === 400) {
        echo " - OK: Self-demotion was successfully blocked!\n";
    } else {
        echo " - FAIL: Self-demotion was allowed!\n";
    }
} catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
    $res = $e->getResponse();
    echo " - Update Self Role status: " . $res->getStatusCode() . "\n";
    echo " - Update Self Role response: " . $res->getContent() . "\n";
    if ($res->getStatusCode() === 400) {
        echo " - OK: Self-demotion was successfully blocked!\n";
    } else {
        echo " - FAIL: Self-demotion returned status " . $res->getStatusCode() . "\n";
    }
} catch (\Throwable $e) {
    echo " - Update Self Role: FAIL (Unexpected exception: " . $e->getMessage() . ")\n";
}


// F. Delete Created User
echo "\nF. Deleting the created user...\n";
$deleteReq = createMockRequest($admin, 'DELETE');
$deleteRes = $controller->destroy($deleteReq, $createdUserId);
echo " - Destroy status: " . $deleteRes->getStatusCode() . "\n";
echo " - Destroy response: " . $deleteRes->getContent() . "\n";

if ($deleteRes->getStatusCode() === 200) {
    echo " - OK: Temporary user deleted successfully!\n";
} else {
    echo " - FAIL: Could not delete temporary user.\n";
}

// Verify deletion in database
$checkDb = User::find($createdUserId);
if ($checkDb === null) {
    echo " - DB confirmation: User successfully removed from database.\n";
} else {
    echo " - DB confirmation FAIL: User still exists in database.\n";
}

echo "\n=========================================================\n";
echo "USER VERIFICATION COMPLETED SUCCESSFULLY\n";
echo "=========================================================\n";
