<?php

namespace App\Http\Controllers;

use App\Http\Requests\VehicleRequest;
use App\Models\Customer;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    public function create(Request $request): Response
    {
        $customers = Customer::forBusiness($request->user()->business_id)->orderBy('name')->get(['id', 'name']);
        $selectedCustomerId = $request->integer('customer_id');

        if (! $customers->contains('id', $selectedCustomerId)) {
            $selectedCustomerId = null;
        }

        return Inertia::render('vehicles/form', compact('customers', 'selectedCustomerId'));
    }

    public function store(VehicleRequest $request): RedirectResponse
    {
        $vehicle = Vehicle::create([...$request->validated(), 'business_id' => $request->user()->business_id, 'plate' => strtoupper((string) $request->input('plate')) ?: null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Veículo salvo com sucesso.']);

        return to_route('customers.show', $vehicle->customer_id);
    }

    public function edit(Request $request, int $vehicle): Response
    {
        $vehicle = Vehicle::forBusiness($request->user()->business_id)->findOrFail($vehicle);
        $customers = Customer::forBusiness($request->user()->business_id)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('vehicles/form', compact('vehicle', 'customers'));
    }

    public function update(VehicleRequest $request, int $vehicle): RedirectResponse
    {
        $vehicle = Vehicle::forBusiness($request->user()->business_id)->findOrFail($vehicle);
        $vehicle->update([...$request->validated(), 'plate' => strtoupper((string) $request->input('plate')) ?: null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Veículo atualizado com sucesso.']);

        return to_route('customers.show', $vehicle->customer_id);
    }
}
