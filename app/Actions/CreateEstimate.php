<?php

namespace App\Actions;

use App\Models\Business;
use App\Models\Estimate;
use App\Support\EstimateSnapshot;
use App\Support\EstimateTotals;
use App\Support\VehicleOwnership;
use Illuminate\Support\Facades\DB;

class CreateEstimate
{
    public function handle(Business $business, array $attributes): Estimate
    {
        return DB::transaction(function () use ($business, $attributes): Estimate {
            Business::lockForUpdate()->findOrFail($business->id);
            VehicleOwnership::lockAndCheck($business->id, $attributes['vehicle_id'], $attributes['customer_id']);
            $number = (int) Estimate::forBusiness($business)->max('number') + 1;
            $totals = EstimateTotals::fromAttributes($attributes);

            $estimate = Estimate::create([
                ...collect($attributes)->except('items')->all(),
                'business_id' => $business->id,
                'number' => $number,
                ...$totals['columns'],
            ]);
            $estimate->items()->createMany($totals['items']);
            EstimateSnapshot::store($estimate);

            return $estimate;
        });
    }
}
