<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function plateVehicle(int $businessId, string $customerName, ?string $plate, string $model = 'Ford Fiesta'): Vehicle
{
    $customer = Customer::factory()->create(['business_id' => $businessId, 'name' => $customerName]);

    return Vehicle::create(['business_id' => $businessId, 'customer_id' => $customer->id, 'model' => $model, 'plate' => $plate]);
}

it('sends the plates already registered in the business to the vehicle form', function () {
    $user = User::factory()->create();
    plateVehicle($user->business_id, 'João Silva', 'ABC-1234', 'Toyota Corolla');
    plateVehicle($user->business_id, 'Sem placa', null);
    plateVehicle(Business::factory()->create()->id, 'Outra oficina', 'XYZ9876');

    $this->actingAs($user)
        ->get('/vehicles/create')
        ->assertInertia(fn (Assert $page) => $page
            ->has('knownPlates', 1)
            ->where('knownPlates.0.plate', 'ABC1234')
            ->where('knownPlates.0.customer_name', 'João Silva')
            ->where('knownPlates.0.model', 'Toyota Corolla')
        );
});

it('does not warn about the vehicle being edited', function () {
    $user = User::factory()->create();
    $vehicle = plateVehicle($user->business_id, 'João Silva', 'ABC1234');

    $this->actingAs($user)
        ->get("/vehicles/{$vehicle->id}/edit")
        ->assertInertia(fn (Assert $page) => $page
            ->has('knownPlates', 0)
            ->where('hasEstimates', false)
        );
});

it('still saves a repeated plate for another customer', function () {
    $user = User::factory()->create();
    plateVehicle($user->business_id, 'João Silva', 'ABC1234');
    $newOwner = Customer::factory()->create(['business_id' => $user->business_id]);

    $this->actingAs($user)
        ->post('/vehicles', ['customer_id' => $newOwner->id, 'model' => 'Ford Fiesta', 'plate' => 'abc1234'])
        ->assertSessionHasNoErrors();

    expect(Vehicle::where('plate', 'ABC1234')->count())->toBe(2);
});

it('does not move a vehicle with estimates to another customer', function () {
    $user = User::factory()->create();
    $vehicle = plateVehicle($user->business_id, 'João Silva', 'ABC1234');
    Estimate::create(['business_id' => $user->business_id, 'customer_id' => $vehicle->customer_id, 'vehicle_id' => $vehicle->id, 'number' => 1, 'status' => 'sent', 'total' => 100, 'date' => '2026-10-19']);
    $newOwner = Customer::factory()->create(['business_id' => $user->business_id]);

    $this->actingAs($user)->get("/vehicles/{$vehicle->id}/edit")->assertInertia(fn (Assert $page) => $page->where('hasEstimates', true));

    $this->actingAs($user)
        ->from("/vehicles/{$vehicle->id}/edit")
        ->put("/vehicles/{$vehicle->id}", ['customer_id' => $newOwner->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234'])
        ->assertSessionHasErrors(['customer_id' => 'Este veículo já tem orçamentos com outro cliente. Para o novo dono, cadastre o veículo de novo.']);

    expect($vehicle->fresh()->customer_id)->not->toBe($newOwner->id);

    $this->actingAs($user)
        ->put("/vehicles/{$vehicle->id}", ['customer_id' => $vehicle->customer_id, 'model' => 'Ford Fiesta Sedan', 'plate' => 'ABC1234'])
        ->assertSessionHasNoErrors();

    expect($vehicle->fresh()->model)->toBe('Ford Fiesta Sedan');
});

it('moves a vehicle without estimates to another customer', function () {
    $user = User::factory()->create();
    $vehicle = plateVehicle($user->business_id, 'João Silva', 'ABC1234');
    $newOwner = Customer::factory()->create(['business_id' => $user->business_id]);

    $this->actingAs($user)
        ->put("/vehicles/{$vehicle->id}", ['customer_id' => $newOwner->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234'])
        ->assertSessionHasNoErrors();

    expect($vehicle->fresh()->customer_id)->toBe($newOwner->id);
});
