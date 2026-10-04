<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function usabilityEstimate(Business $business, array $items = [['description' => 'Pintura', 'amount' => 45000]], int $number = 1): Estimate
{
    $customer = Customer::factory()->create(['business_id' => $business->id]);
    $vehicle = Vehicle::create(['business_id' => $business->id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234']);
    $estimate = Estimate::create([
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'number' => $number,
        'status' => 'draft',
        'notes' => 'Válido por 7 dias.',
        'total' => array_sum(array_column($items, 'amount')),
        'date' => '2026-09-14',
    ]);
    $estimate->items()->createMany($items);

    return $estimate;
}

it('marks an estimate as sent and back to draft', function () {
    $user = User::factory()->create();
    $estimate = usabilityEstimate($user->business);

    $this->actingAs($user)
        ->from("/estimates/{$estimate->id}")
        ->patch("/estimates/{$estimate->id}/status", ['status' => 'sent'])
        ->assertRedirect("/estimates/{$estimate->id}")
        ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Orçamento marcado como enviado.']);

    expect($estimate->fresh()->status)->toBe('sent');

    $this->actingAs($user)
        ->from("/estimates/{$estimate->id}")
        ->patch("/estimates/{$estimate->id}/status", ['status' => 'draft'])
        ->assertRedirect("/estimates/{$estimate->id}");

    expect($estimate->fresh()->status)->toBe('draft');
});

it('rejects an invalid estimate status', function () {
    $user = User::factory()->create();
    $estimate = usabilityEstimate($user->business);

    $this->actingAs($user)
        ->from("/estimates/{$estimate->id}")
        ->patch("/estimates/{$estimate->id}/status", ['status' => 'paid'])
        ->assertSessionHasErrors(['status' => 'Selecione um status válido.']);

    expect($estimate->fresh()->status)->toBe('draft');
});

it('does not change the status of another business estimate', function () {
    $user = User::factory()->create();
    $estimate = usabilityEstimate(Business::factory()->create());

    $this->actingAs($user)
        ->patch("/estimates/{$estimate->id}/status", ['status' => 'sent'])
        ->assertNotFound();

    expect($estimate->fresh()->status)->toBe('draft');
});

it('prefills a new estimate from an estimate being duplicated', function () {
    $user = User::factory()->create();
    $estimate = usabilityEstimate($user->business, [
        ['description' => 'Pintura', 'amount' => 45000],
        ['description' => 'Polimento', 'amount' => 12000],
    ]);

    $this->actingAs($user)
        ->get("/estimates/create?duplicate={$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->component('estimates/form')
            ->where('selectedCustomerId', $estimate->customer_id)
            ->where('selectedVehicleId', $estimate->vehicle_id)
            ->where('duplicateOf.number', 1)
            ->where('duplicateOf.notes', 'Válido por 7 dias.')
            ->has('duplicateOf.items', 2)
            ->where('duplicateOf.items.1.description', 'Polimento')
            ->where('duplicateOf.items.1.amount', 12000)
        );
});

it('ignores a duplicate request for another business estimate', function () {
    $user = User::factory()->create();
    $estimate = usabilityEstimate(Business::factory()->create());

    $this->actingAs($user)
        ->get("/estimates/create?duplicate={$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->component('estimates/form')
            ->where('duplicateOf', null)
            ->where('selectedCustomerId', null)
        );
});

it('suggests item descriptions already used by the same business only', function () {
    $user = User::factory()->create();
    usabilityEstimate($user->business, [
        ['description' => 'Pintura', 'amount' => 45000],
        ['description' => 'Troca de óleo', 'amount' => 15000],
    ]);
    usabilityEstimate($user->business, [['description' => 'Pintura', 'amount' => 50000]], 2);
    usabilityEstimate(Business::factory()->create(), [['description' => 'Serviço de outra oficina', 'amount' => 100]]);

    $this->actingAs($user)
        ->get('/estimates/create')
        ->assertInertia(fn (Assert $page) => $page
            ->component('estimates/form')
            ->where('itemSuggestions', ['Pintura', 'Troca de óleo'])
        );
});

it('shows the first steps guide until the business has estimates', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('onboarding.hasCustomers', false)
            ->where('onboarding.hasVehicles', false)
        );

    usabilityEstimate($user->business);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('onboarding', null)
            ->has('estimates', 1)
        );
});
