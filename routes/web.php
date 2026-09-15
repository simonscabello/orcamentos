<?php

use App\Http\Controllers\BusinessController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\EstimatePdfController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

// Manifest da PWA gerado a partir da configuração, para a marca ficar num só lugar.
Route::get('manifest.webmanifest', function () {
    return response()->json([
        'name' => config('app.name'),
        'short_name' => config('brand.short_name'),
        'description' => config('brand.description'),
        'lang' => 'pt-BR',
        'dir' => 'ltr',
        'start_url' => '/dashboard',
        'scope' => '/',
        'display' => 'standalone',
        'orientation' => 'portrait',
        'background_color' => config('brand.background_color'),
        'theme_color' => config('brand.theme_color'),
        'categories' => ['business', 'productivity'],
        'icons' => [[
            'src' => config('brand.icon'),
            'sizes' => 'any',
            'type' => 'image/svg+xml',
            'purpose' => 'any maskable',
        ]],
    ], options: JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ->header('Content-Type', 'application/manifest+json');
})->name('manifest');

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
