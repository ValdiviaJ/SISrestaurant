<?php
require '/var/www/vendor/autoload.php';
$app = require_once '/var/www/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use Carbon\Carbon;

echo "Current Time (UTC): " . Carbon::now()->toDateTimeString() . "\n";
echo "Today Start (UTC): " . Carbon::today()->startOfDay()->toDateTimeString() . "\n";
echo "Today End (UTC): " . Carbon::today()->endOfDay()->toDateTimeString() . "\n\n";

$orders = Order::orderBy('created_at', 'desc')->limit(10)->get();
echo "Last 10 Orders:\n";
foreach ($orders as $o) {
    echo "ID: {$o->id} | Status: {$o->status} | Total: {$o->total} | Created At: {$o->created_at} | Created At (Parsed): " . Carbon::parse($o->created_at)->toDateTimeString() . "\n";
}
