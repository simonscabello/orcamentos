<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Vehicle> */
class VehicleFactory extends Factory
{
    public function definition(): array
    {
        $customer = Customer::factory()->create();

        return ['business_id' => $customer->business_id, 'customer_id' => $customer->id, 'model' => fake()->word().' '.fake()->word(), 'plate' => 'ABC1234'];
    }
}
