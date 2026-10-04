<?php

namespace App\Http\Controllers;

use App\Actions\CreateEstimate;
use App\Actions\UpdateEstimate;
use App\Http\Requests\EstimateRequest;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstimateController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        // Filtro por veículo: usado pelos atalhos "ver orçamentos" da ficha do cliente.
        $vehicleId = $request->integer('vehicle_id');
        $vehicle = $vehicleId
            ? Vehicle::forBusiness($request->user()->business_id)->with('customer:id,name')->find($vehicleId)
            : null;

        $estimates = Estimate::forBusiness($request->user()->business_id)
            ->with(['customer:id,name,phone', 'vehicle:id,model,plate'])
            ->when($vehicle, fn ($query) => $query->where('vehicle_id', $vehicle->id))
            ->when($search, fn ($query) => $query->where(fn ($q) => $q->whereHas('customer', fn ($customer) => $customer->whereRaw('lower(name) like ?', ['%'.strtolower($search).'%'])->orWhereRaw('lower(phone) like ?', ['%'.strtolower($search).'%']))->orWhereHas('vehicle', fn ($vehicle) => $vehicle->whereRaw('lower(plate) like ?', ['%'.strtolower($search).'%']))))
            ->latest()->get();

        return Inertia::render('estimates/index', compact('estimates', 'search', 'vehicle'));
    }

    public function create(Request $request): Response
    {
        $data = $this->formData($request);

        // Cliente e veículo só vêm preenchidos quando a tela de origem indicou qual é (ex.: ficha do cliente).
        $vehicle = $data['vehicles']->firstWhere('id', $request->integer('vehicle_id'));
        $customerId = $vehicle?->customer_id
            ?? $data['customers']->firstWhere('id', $request->integer('customer_id'))?->id;

        // "Duplicar": reaproveita cliente, veículo, itens e observações de um orçamento da mesma oficina.
        $source = $request->integer('duplicate')
            ? Estimate::forBusiness($request->user()->business_id)->with('items')->find($request->integer('duplicate'))
            : null;

        return Inertia::render('estimates/form', [
            ...$data,
            'selectedCustomerId' => $source?->customer_id ?? $customerId,
            'selectedVehicleId' => $source?->vehicle_id ?? ($customerId ? $vehicle?->id : null),
            'duplicateOf' => $source ? [
                'number' => $source->number,
                'notes' => $source->notes,
                'items' => $source->items->map->only(['description', 'amount'])->values(),
            ] : null,
        ]);
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

    public function status(Request $request, int $estimate): RedirectResponse
    {
        $validated = $request->validate(
            ['status' => ['required', Rule::in(['draft', 'sent'])]],
            ['status.required' => 'Selecione um status.', 'status.in' => 'Selecione um status válido.'],
        );

        $this->estimate($request, $estimate)->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => $validated['status'] === 'sent'
            ? 'Orçamento marcado como enviado.'
            : 'Orçamento voltou para rascunho.']);

        return back();
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
            // Serviços já usados pela oficina, do mais recente para o mais antigo, para sugerir ao digitar.
            'itemSuggestions' => EstimateItem::query()
                ->join('estimates', 'estimates.id', '=', 'estimate_items.estimate_id')
                ->where('estimates.business_id', $businessId)
                ->groupBy('estimate_items.description')
                ->orderByRaw('max(estimate_items.id) desc')
                ->limit(100)
                ->pluck('estimate_items.description'),
        ];
    }
}
