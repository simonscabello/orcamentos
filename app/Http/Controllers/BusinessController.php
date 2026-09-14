<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('business/edit', ['business' => $request->user()->business]);
    }

    public function update(BusinessRequest $request): RedirectResponse
    {
        $request->user()->business->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Configurações salvas com sucesso.']);

        return to_route('business.edit');
    }
}
