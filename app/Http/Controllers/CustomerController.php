<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $customers = Customer::forBusiness($request->user()->business_id)
            ->when($search, fn ($query) => $query->where(fn ($q) => $q->whereRaw('lower(name) like ?', ['%'.strtolower($search).'%'])->orWhereRaw('lower(phone) like ?', ['%'.strtolower($search).'%'])))
            ->withCount('vehicles')->latest()->get();

        return Inertia::render('customers/index', compact('customers', 'search'));
    }

    public function create(): Response
    {
        return Inertia::render('customers/form');
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create([...$request->validated(), 'business_id' => $request->user()->business_id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente salvo com sucesso.']);

        return to_route('customers.show', $customer);
    }

    public function show(Request $request, int $customer): Response
    {
        $customer = Customer::forBusiness($request->user()->business_id)->with('vehicles')->findOrFail($customer);

        return Inertia::render('customers/show', compact('customer'));
    }

    public function edit(Request $request, int $customer): Response
    {
        $customer = Customer::forBusiness($request->user()->business_id)->findOrFail($customer);

        return Inertia::render('customers/form', compact('customer'));
    }

    public function update(CustomerRequest $request, int $customer): RedirectResponse
    {
        $customer = Customer::forBusiness($request->user()->business_id)->findOrFail($customer);
        $customer->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente atualizado com sucesso.']);

        return to_route('customers.show', $customer);
    }
}
