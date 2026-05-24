<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Http\Controllers\API\DashboardController;
use Illuminate\Http\Request;

echo "=========================================================\n";
echo "RESTOSUITE - DASHBOARD MODULE VERIFICATION SCRIPT\n";
echo "=========================================================\n\n";

// 1. Fetch Seeded Users
$admin = User::where('email', 'admin@restosuite.com')->first();
$mozo = User::where('email', 'mozo@restosuite.com')->first();

if (!$admin || !$mozo) {
    echo "ERROR: Seeded users (admin, mozo) not found! Please seed the database first.\n";
    exit(1);
}

echo "Found Users:\n";
echo " - Admin: {$admin->name} (Role: {$admin->role->slug})\n";
echo " - Mozo: {$mozo->name} (Role: {$mozo->role->slug})\n\n";

$controller = app(DashboardController::class);

// Helper function to simulate a Request with a specific user
function createMockRequest($user, $method = 'GET', $queryParams = []) {
    $request = Request::create('/api/dashboard', $method, $queryParams);
    $request->setUserResolver(function () use ($user) {
        return $user;
    });
    return $request;
}

// 2. SECURITY TEST: Non-admin users should get 403 Forbidden
echo "---------------------------------------------------------\n";
echo "SECURITY TEST: Access Control (Expect 403 for Non-Admins)\n";
echo "---------------------------------------------------------\n";

$endpoints = [
    'getStats' => [],
    'getSalesChartData' => ['period' => '7d'],
    'getBestSellers' => []
];

// Perform actual controller call and check status code response
foreach ($endpoints as $method => $params) {
    $reqMozo = createMockRequest($mozo, 'GET', $params);
    $res = $controller->$method($reqMozo);
    if ($res->getStatusCode() === 403) {
        echo " - {$method}: OK (Returned 403 - " . $res->getContent() . ")\n";
    } else {
        echo " - {$method}: FAIL (Returned {$res->getStatusCode()} - " . $res->getContent() . ")\n";
    }
}

// 3. ADMIN RETRIEVE STATS
echo "\n---------------------------------------------------------\n";
echo "ADMIN STATS TEST: Fetching Stats as Admin\n";
echo "---------------------------------------------------------\n";

try {
    $reqAdminStats = createMockRequest($admin);
    $res = $controller->getStats($reqAdminStats);
    echo " - Status: " . $res->getStatusCode() . "\n";
    echo " - Stats Structure Verification:\n";
    $stats = json_decode($res->getContent(), true);
    
    if (is_array($stats) && count($stats) === 4) {
        echo "   * OK: Statistics array has 4 cards.\n";
        foreach ($stats as $idx => $card) {
            echo "   * Card " . ($idx + 1) . ": {$card['name']} = {$card['value']} (Change: {$card['change']}, Type: {$card['type']})\n";
        }
    } else {
        echo "   * FAIL: Stats response structure is invalid.\n";
    }
} catch (\Throwable $e) {
    echo " - FAIL: Unexpected exception: " . $e->getMessage() . "\n";
}

// 4. ADMIN RETRIEVE CHART DATA
echo "\n---------------------------------------------------------\n";
echo "ADMIN CHART TEST: Fetching Sales Chart Data as Admin\n";
echo "---------------------------------------------------------\n";

$periods = ['7d', 'month', 'year'];
foreach ($periods as $period) {
    try {
        $reqAdminChart = createMockRequest($admin, 'GET', ['period' => $period]);
        $res = $controller->getSalesChartData($reqAdminChart);
        echo " - Period [{$period}] Status: " . $res->getStatusCode() . "\n";
        $data = json_decode($res->getContent(), true);
        
        if (is_array($data)) {
            echo "   * OK: Data is a valid list. Points count: " . count($data) . "\n";
            if (count($data) > 0) {
                echo "   * Sample point: label={$data[0]['label']}, date={$data[0]['date']}, total={$data[0]['total']}\n";
            }
        } else {
            echo "   * FAIL: Chart response is not an array.\n";
        }
    } catch (\Throwable $e) {
        echo " - FAIL: Unexpected exception for period {$period}: " . $e->getMessage() . "\n";
    }
}

// Invalid period test
try {
    $reqAdminInvalidPeriod = createMockRequest($admin, 'GET', ['period' => 'invalid_val']);
    $res = $controller->getSalesChartData($reqAdminInvalidPeriod);
    if ($res->getStatusCode() === 422) {
        echo " - Period [invalid_val] OK (Returned 422 - " . $res->getContent() . ")\n";
    } else {
        echo " - Period [invalid_val] FAIL (Returned {$res->getStatusCode()} - " . $res->getContent() . ")\n";
    }
} catch (\Throwable $e) {
    echo " - Period [invalid_val] FAIL with exception: " . $e->getMessage() . "\n";
}

// 5. ADMIN RETRIEVE BEST SELLERS
echo "\n---------------------------------------------------------\n";
echo "ADMIN BEST SELLERS TEST: Fetching Top Dishes as Admin\n";
echo "---------------------------------------------------------\n";

try {
    $reqAdminSellers = createMockRequest($admin, 'GET', ['limit' => 5]);
    $res = $controller->getBestSellers($reqAdminSellers);
    echo " - Status: " . $res->getStatusCode() . "\n";
    $sellers = json_decode($res->getContent(), true);
    
    if (is_array($sellers)) {
        echo "   * OK: Response is a valid list. Best sellers count: " . count($sellers) . "\n";
        foreach ($sellers as $idx => $seller) {
            echo "   * Top " . ($idx + 1) . ": {$seller['name']} ({$seller['quantity_sold']} sold, Revenue: {$seller['revenue']})\n";
        }
    } else {
        echo "   * FAIL: Best sellers response is not an array.\n";
    }
} catch (\Throwable $e) {
    echo " - FAIL: Unexpected exception: " . $e->getMessage() . "\n";
}

echo "\n=========================================================\n";
echo "DASHBOARD VERIFICATION COMPLETED\n";
echo "=========================================================\n";
