<?php

use App\Http\Controllers\BusinessController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\EstimatePdfController;
use App\Http\Controllers\VehicleController;
use App\Models\Vehicle;
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

        // Guia de primeiros passos: só é exibido enquanto a oficina não tem orçamentos.
        $onboarding = $estimates->isEmpty() ? [
            'hasCustomers' => $business->customers()->exists(),
            'hasVehicles' => Vehicle::forBusiness($business)->exists(),
        ] : null;

        return inertia('dashboard', compact('business', 'estimates', 'onboarding'));
    })->name('dashboard');

    // Os controllers recebem `int $id`: sem o filtro numérico, /estimates/abc virava erro 500.
    Route::resource('customers', CustomerController::class)->except('destroy')->where(['customer' => '[0-9]+']);
    Route::resource('vehicles', VehicleController::class)->only(['create', 'store', 'edit', 'update'])->where(['vehicle' => '[0-9]+']);
    Route::resource('estimates', EstimateController::class)->except('destroy')->where(['estimate' => '[0-9]+']);
    Route::get('estimates/{estimate}/pdf', EstimatePdfController::class)->whereNumber('estimate')->name('estimates.pdf');
    Route::patch('estimates/{estimate}/status', [EstimateController::class, 'status'])->whereNumber('estimate')->name('estimates.status');
    Route::get('settings/business', [BusinessController::class, 'edit'])->name('business.edit');
    Route::put('settings/business', [BusinessController::class, 'update'])->name('business.update');
});

require __DIR__.'/settings.php';
