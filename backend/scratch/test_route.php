<?php
require '/var/www/vendor/autoload.php';
$app = require_once '/var/www/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

$request = Request::create('/', 'GET');
try {
    $route = Route::getRoutes()->match($request);
    echo "Matched URI: " . $route->uri() . "\n";
    echo "Middleware: " . implode(', ', $route->middleware()) . "\n";
} catch (\Exception $e) {
    echo "Error matching route: " . $e->getMessage() . "\n";
}
