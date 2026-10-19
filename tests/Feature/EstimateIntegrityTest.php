<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function integrityVehicle(Business $business, string $customerName = 'Cliente Teste', string $plate = 'ABC1234'): array
{
    $customer = Customer::factory()->create(['business_id' => $business->id, 'name' => $customerName]);
    $vehicle = Vehicle::create(['business_id' => $business->id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta', 'plate' => $plate]);

    return [$customer, $vehicle];
}

function integrityPayload(Customer $customer, Vehicle $vehicle, array $items): array
{
    return ['customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'date' => '2026-09-14', 'status' => 'draft', 'notes' => null, 'items' => $items];
}

it('recalculates the total and keeps the number when items are edited or removed', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = integrityVehicle($user->business);

    $this->actingAs($user)->post('/estimates', integrityPayload($customer, $vehicle, [
        ['description' => 'Pintura', 'amount' => 45000],
        ['description' => 'Polimento', 'amount' => 12050],
        ['description' => 'Lanternagem', 'amount' => 30001],
    ]));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", [
            ...integrityPayload($customer, $vehicle, [
                ['description' => 'Pintura completa', 'amount' => 50099],
                ['description' => 'Polimento', 'amount' => 1],
            ]),
            'total' => 1,
            'number' => 99,
        ])
        ->assertRedirect("/estimates/{$estimate->id}");

    $estimate->refresh();

    expect($estimate->total)->toBe(50100)
        ->and($estimate->number)->toBe(1)
        ->and($estimate->items()->count())->toBe(2)
        ->and($estimate->items->pluck('description')->all())->toBe(['Pintura completa', 'Polimento']);
});

it('keeps items in the order they were typed', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = integrityVehicle($user->business);
    $descriptions = ['Zeta', 'Alfa', 'Meio', 'Beta'];

    $this->actingAs($user)->post('/estimates', integrityPayload($customer, $vehicle, array_map(
        fn (string $description) => ['description' => $description, 'amount' => 100],
        $descriptions,
    )));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('estimate.items.0.description', 'Zeta')
            ->where('estimate.items.3.description', 'Beta')
        );
});

it('does not edit or update another business estimate', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = integrityVehicle($user->business);
    $other = Business::factory()->create();
    [$otherCustomer, $otherVehicle] = integrityVehicle($other);
    $estimate = Estimate::create(['business_id' => $other->id, 'customer_id' => $otherCustomer->id, 'vehicle_id' => $otherVehicle->id, 'number' => 1, 'status' => 'draft', 'total' => 100, 'date' => '2026-09-14']);

    $this->actingAs($user)->get("/estimates/{$estimate->id}/edit")->assertNotFound();
    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", integrityPayload($customer, $vehicle, [['description' => 'Invasão', 'amount' => 1]]))
        ->assertNotFound();

    expect($estimate->fresh()->total)->toBe(100);
});

it('returns not found for non numeric ids', function (string $url) {
    $this->actingAs(User::factory()->create())->get($url)->assertNotFound();
})->with([
    '/estimates/abc',
    '/estimates/abc/edit',
    '/estimates/abc/pdf',
    '/customers/abc',
    '/customers/abc/edit',
    '/vehicles/abc/edit',
]);

it('returns to the estimate after changing its status even without a referer', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = integrityVehicle($user->business);
    $this->actingAs($user)->post('/estimates', integrityPayload($customer, $vehicle, [['description' => 'Pintura', 'amount' => 100]]));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->patch("/estimates/{$estimate->id}/status", ['status' => 'sent'])
        ->assertRedirect("/estimates/{$estimate->id}");
});

it('finds customers and estimates by accented names typed in uppercase', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = integrityVehicle($user->business, 'João Conceição');
    $this->actingAs($user)->post('/estimates', integrityPayload($customer, $vehicle, [['description' => 'Pintura', 'amount' => 100]]));

    $this->actingAs($user)
        ->get('/customers?search=JOÃO')
        ->assertInertia(fn (Assert $page) => $page->has('customers', 1));

    $this->actingAs($user)
        ->get('/estimates?search=CONCEIÇÃO')
        ->assertInertia(fn (Assert $page) => $page->has('estimates', 1));
});

it('treats percent and underscore in the search as plain text', function () {
    $user = User::factory()->create();
    integrityVehicle($user->business, 'Maria');
    integrityVehicle($user->business, 'Desconto 10% Silva');

    $this->actingAs($user)
        ->get('/customers?search=%25')
        ->assertInertia(fn (Assert $page) => $page
            ->has('customers', 1)
            ->where('customers.0.name', 'Desconto 10% Silva')
        );

    $this->actingAs($user)
        ->get('/customers?search=_')
        ->assertInertia(fn (Assert $page) => $page->has('customers', 0));
});
