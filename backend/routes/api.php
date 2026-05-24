<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\DishController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\TableController;
use App\Http\Controllers\API\KitchenController;
use App\Http\Controllers\API\POSController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\DashboardController;


/*
|--------------------------------------------------------------------------
| API Routes - RestoSuite Restaurant Management System
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

// ==========================================
// 1. AUTHENTICATION MODULE
// ==========================================
Route::group(['prefix' => 'auth'], function () {
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });
});

// ==========================================
// PROTECTED API ENDPOINTS (Requires Auth)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // ==========================================
    // 2. DASHBOARD MODULE
    // ==========================================
    Route::group(['prefix' => 'dashboard'], function () {
        Route::get('/stats', [DashboardController::class, 'getStats'])->name('dashboard.stats');
        Route::get('/sales-chart', [DashboardController::class, 'getSalesChartData'])->name('dashboard.sales-chart');
        Route::get('/best-sellers', [DashboardController::class, 'getBestSellers'])->name('dashboard.best-sellers');
    });

    // ==========================================
    // 3. DISHES & MENU MODULE
    // ==========================================
    Route::apiResource('dishes', DishController::class);
    Route::patch('/dishes/{dish}/toggle-availability', [DishController::class, 'toggleAvailability'])->name('dishes.toggle-availability');
    Route::apiResource('categories', CategoryController::class);

    // ==========================================
    // 4. TABLES MODULE
    // ==========================================
    Route::apiResource('tables', TableController::class);
    Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus'])->name('tables.update-status');

    // ==========================================
    // 5. ORDERS MODULE
    // ==========================================
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

    // ==========================================
    // 6. KITCHEN MODULE (KDS)
    // ==========================================
    Route::group(['prefix' => 'kitchen'], function () {
        Route::get('/tickets', [KitchenController::class, 'getPendingTickets'])->name('kitchen.tickets');
        Route::patch('/tickets/{order}/start', [KitchenController::class, 'startPreparation'])->name('kitchen.start-prep');
        Route::patch('/tickets/{order}/ready', [KitchenController::class, 'markAsReady'])->name('kitchen.mark-ready');
    });

    // ==========================================
    // 7. POS MODULE (Caja)
    // ==========================================
    Route::group(['prefix' => 'pos'], function () {
        Route::get('/orders', [POSController::class, 'getUnpaidOrders'])->name('pos.orders');
        Route::post('/checkout', [POSController::class, 'processCheckout'])->name('pos.checkout');
        Route::get('/payment-methods', [POSController::class, 'getPaymentMethods'])->name('pos.payment-methods');
    });

    // ==========================================
    // 8. REPORTS MODULE
    // ==========================================
    Route::group(['prefix' => 'reports'], function () {
        Route::get('/sales', [ReportController::class, 'getSalesSummary'])->name('reports.sales');
        Route::get('/best-sellers', [ReportController::class, 'getBestSellers'])->name('reports.best-sellers');
        Route::get('/orders-count', [ReportController::class, 'getOrdersVolume'])->name('reports.orders-volume');
    });

    // ==========================================
    // 9. USERS MODULE (CRUD)
    // ==========================================
    Route::apiResource('users', UserController::class);
    Route::get('/roles', [UserController::class, 'getRoles'])->name('users.roles');

    // ==========================================
    // 10. SYSTEM CONFIGURATION MODULE
    // ==========================================
    Route::group(['prefix' => 'settings'], function () {
        Route::get('/', [SettingController::class, 'getSettings'])->name('settings.get');
        Route::put('/', [SettingController::class, 'updateSettings'])->name('settings.update');
    });

});
