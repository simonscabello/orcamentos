<?php

use App\Http\Controllers\BusinessController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\EstimatePdfController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $business = request()->user()->business;
        $estimates = $business->estimates()->with(['customer:id,name', 'vehicle:id,model'])->latest()->take(5)->get();

        return inertia('dashboard', compact('business', 'estimates'));
    })->name('dashboard');

    Route::resource('customers', CustomerController::class)->except('destroy');
    Route::resource('vehicles', VehicleController::class)->only(['create', 'store', 'edit', 'update']);
    Route::resource('estimates', EstimateController::class)->except('destroy');
    Route::get('estimates/{estimate}/pdf', EstimatePdfController::class)->name('estimates.pdf');
    Route::get('settings/business', [BusinessController::class, 'edit'])->name('business.edit');
    Route::put('settings/business', [BusinessController::class, 'update'])->name('business.update');
});

require __DIR__.'/settings.php';
