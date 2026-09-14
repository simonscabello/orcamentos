<?php

namespace App\Http\Controllers;

use App\Actions\CreateEstimate;
use App\Actions\UpdateEstimate;
use App\Http\Requests\EstimateRequest;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EstimateController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $estimates = Estimate::forBusiness($request->user()->business_id)
            ->with(['customer:id,name,phone', 'vehicle:id,model,plate'])
            ->when($search, fn ($query) => $query->where(fn ($q) => $q->whereHas('customer', fn ($customer) => $customer->whereRaw('lower(name) like ?', ['%'.strtolower($search).'%'])->orWhereRaw('lower(phone) like ?', ['%'.strtolower($search).'%']))->orWhereHas('vehicle', fn ($vehicle) => $vehicle->whereRaw('lower(plate) like ?', ['%'.strtolower($search).'%']))))
            ->latest()->get();

        return Inertia::render('estimates/index', compact('estimates', 'search'));
    }

    public function create(Request $request): Response
    {
        return Inertia::render('estimates/form', $this->formData($request));
    }

    public function store(EstimateRequest $request, CreateEstimate $createEstimate): RedirectResponse
    {
        $estimate = $createEstimate->handle($request->user()->business, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Orçamento criado com sucesso.']);

        return to_route('estimates.show', $estimate);
    }

    public function show(Request $request, int $estimate): Response
    {
        $estimate = $this->estimate($request, $estimate)->load(['customer', 'vehicle', 'items']);

        return Inertia::render('estimates/show', compact('estimate'));
    }

    public function edit(Request $request, int $estimate): Response
    {
        $estimate = $this->estimate($request, $estimate)->load('items');

        return Inertia::render('estimates/form', [...$this->formData($request), 'estimate' => $estimate]);
    }

    public function update(EstimateRequest $request, int $estimate, UpdateEstimate $updateEstimate): RedirectResponse
    {
        $estimate = $updateEstimate->handle($this->estimate($request, $estimate), $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Orçamento atualizado com sucesso.']);

        return to_route('estimates.show', $estimate);
    }

    private function estimate(Request $request, int $id): Estimate
    {
        return Estimate::forBusiness($request->user()->business_id)->findOrFail($id);
    }

    private function formData(Request $request): array
    {
        $businessId = $request->user()->business_id;

        return [
            'customers' => Customer::forBusiness($businessId)->orderBy('name')->get(['id', 'name', 'phone']),
            'vehicles' => Vehicle::forBusiness($businessId)->orderBy('model')->get(['id', 'customer_id', 'model', 'plate', 'color']),
        ];
    }
}
