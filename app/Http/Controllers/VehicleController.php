<?php

namespace App\Http\Controllers;

use App\Http\Requests\VehicleRequest;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Support\VehicleOwnership;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        return Inertia::render('vehicles/form', [
            ...compact('customers', 'selectedCustomerId'),
            'knownPlates' => $this->knownPlates($request),
        ]);
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

        return Inertia::render('vehicles/form', [
            ...compact('vehicle', 'customers'),
            'knownPlates' => $this->knownPlates($request, $vehicle->id),
            'hasEstimates' => $vehicle->estimates()->exists(),
        ]);
    }

    public function update(VehicleRequest $request, int $vehicle): RedirectResponse
    {
        $vehicle = DB::transaction(function () use ($request, $vehicle): Vehicle {
            // A trava no veículo serializa com a criação de orçamentos (VehicleOwnership).
            $vehicle = Vehicle::forBusiness($request->user()->business_id)->lockForUpdate()->findOrFail($vehicle);

            if ($vehicle->customer_id !== $request->integer('customer_id') && $vehicle->estimates()->exists()) {
                throw ValidationException::withMessages(['customer_id' => VehicleOwnership::OWNER_LOCKED_MESSAGE]);
            }

            $vehicle->update([...$request->validated(), 'plate' => strtoupper((string) $request->input('plate')) ?: null]);

            return $vehicle;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Veículo atualizado com sucesso.']);

        return to_route('customers.show', $vehicle->customer_id);
    }

    /**
     * Placas já cadastradas na oficina, para o formulário avisar quando o mesmo carro aparece de novo.
     *
     * @return array<int, array{plate: string, customer_id: int, customer_name: string, model: string}>
     */
    private function knownPlates(Request $request, ?int $exceptVehicleId = null): array
    {
        return Vehicle::forBusiness($request->user()->business_id)
            ->whereNotNull('plate')
            ->when($exceptVehicleId, fn ($query) => $query->whereKeyNot($exceptVehicleId))
            ->with('customer:id,name')
            ->get(['id', 'customer_id', 'plate', 'model'])
            ->map(fn (Vehicle $vehicle) => [
                'plate' => Vehicle::normalizePlate($vehicle->plate),
                'customer_id' => $vehicle->customer_id,
                'customer_name' => $vehicle->customer->name,
                'model' => $vehicle->model,
            ])
            ->all();
    }
}
