<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function tenantData(User $user, Customer $customer, Vehicle $vehicle, array $items = [['description' => 'Pintura', 'amount' => 45000]]): array
{
    return ['customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'date' => '2026-09-14', 'status' => 'draft', 'notes' => 'Teste', 'items' => $items];
}

function tenantVehicle(Business $business): array
{
    $customer = Customer::factory()->create(['business_id' => $business->id]);
    $vehicle = Vehicle::create(['business_id' => $business->id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234']);

    return [$customer, $vehicle];
}

it('associates each user with a business', function () {
    $user = User::factory()->create();
    expect($user->business)->not->toBeNull();
});

it('creates customers for the authenticated business only', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/customers', ['name' => 'Eli José', 'phone' => '11999999999'])->assertRedirect();
    $this->assertDatabaseHas('customers', ['business_id' => $user->business_id, 'name' => 'Eli José']);
});

it('does not expose another business customer or vehicle', function () {
    $user = User::factory()->create();
    $other = Business::factory()->create();
    [$customer, $vehicle] = tenantVehicle($other);
    $this->actingAs($user)->get("/customers/{$customer->id}")->assertNotFound();
    $this->actingAs($user)->get("/vehicles/{$vehicle->id}/edit")->assertNotFound();
});

it('does not expose another business estimate or its pdf', function () {
    $user = User::factory()->create();
    $other = Business::factory()->create();
    [$customer, $vehicle] = tenantVehicle($other);
    $estimate = Estimate::create(['business_id' => $other->id, 'customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'number' => 1, 'status' => 'draft', 'total' => 100, 'date' => '2026-09-14']);
    $this->actingAs($user)->get("/estimates/{$estimate->id}")->assertNotFound();
    $this->actingAs($user)->get("/estimates/{$estimate->id}/pdf")->assertNotFound();
});

it('generates a real pdf only for the estimate owner', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = tenantVehicle($user->business);
    $this->actingAs($user)->post('/estimates', tenantData($user, $customer, $vehicle));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}/pdf")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertSee('%PDF', false);
});

it('serializes the estimate date as an ISO date for the frontend', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = tenantVehicle($user->business);
    $estimate = Estimate::create([
        'business_id' => $user->business_id,
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'number' => 1,
        'status' => 'draft',
        'total' => 100,
        'date' => '2026-09-14',
    ]);

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->component('estimates/show')
            ->where('estimate.date', '2026-09-14')
        );
});

it('calculates totals and numbers estimates per business', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = tenantVehicle($user->business);
    $this->actingAs($user)->post('/estimates', tenantData($user, $customer, $vehicle, [['description' => 'Pintura', 'amount' => 45000], ['description' => 'Funilaria', 'amount' => 120000]]))->assertRedirect();
    $this->actingAs($user)->post('/estimates', tenantData($user, $customer, $vehicle))->assertRedirect();
    expect(Estimate::forBusiness($user->business)->orderBy('number')->pluck('number')->all())->toBe([1, 2]);
    expect(Estimate::forBusiness($user->business)->first()->total)->toBe(165000);
});

it('calculates cents exactly without trusting a supplied total', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = tenantVehicle($user->business);
    $data = tenantData($user, $customer, $vehicle, [
        ['description' => 'Peça A', 'amount' => 1010],
        ['description' => 'Peça B', 'amount' => 2020],
        ['description' => 'Centavo', 'amount' => 1],
        ['description' => 'Valor alto', 'amount' => 1000000],
    ]);
    $data['total'] = 1;

    $this->actingAs($user)->post('/estimates', $data)->assertRedirect();
    expect(Estimate::forBusiness($user->business)->firstOrFail()->total)->toBe(1003031);
});

it('allows each business to have estimate number one', function () {
    $first = User::factory()->create();
    $second = User::factory()->create();
    [$firstCustomer, $firstVehicle] = tenantVehicle($first->business);
    [$secondCustomer, $secondVehicle] = tenantVehicle($second->business);
    $this->actingAs($first)->post('/estimates', tenantData($first, $firstCustomer, $firstVehicle));
    $this->actingAs($second)->post('/estimates', tenantData($second, $secondCustomer, $secondVehicle));
    expect(Estimate::forBusiness($first->business)->first()->number)->toBe(1)->and(Estimate::forBusiness($second->business)->first()->number)->toBe(1);
});

it('rejects an estimate using a vehicle from another business', function () {
    $user = User::factory()->create();
    [$customer] = tenantVehicle($user->business);
    $other = Business::factory()->create();
    [, $foreignVehicle] = tenantVehicle($other);
    $this->actingAs($user)->from('/estimates/create')->post('/estimates', tenantData($user, $customer, $foreignVehicle))->assertRedirect('/estimates/create')->assertSessionHasErrors('vehicle_id');
});

it('rejects an update that changes an estimate to a foreign vehicle', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = tenantVehicle($user->business);
    $this->actingAs($user)->post('/estimates', tenantData($user, $customer, $vehicle));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();
    $other = Business::factory()->create();
    [, $foreignVehicle] = tenantVehicle($other);

    $this->actingAs($user)
        ->from("/estimates/{$estimate->id}/edit")
        ->put("/estimates/{$estimate->id}", tenantData($user, $customer, $foreignVehicle))
        ->assertRedirect("/estimates/{$estimate->id}/edit")
        ->assertSessionHasErrors('vehicle_id');
});
