<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::find(1);
if ($user) {
    $user->role_id = 1;
    $user->save();
    echo "SUCCESS: User " . $user->email . " role has been restored to: " . $user->role_id . " (" . $user->role->slug . ")\n";
} else {
    echo "ERROR: User ID 1 not found.\n";
}
