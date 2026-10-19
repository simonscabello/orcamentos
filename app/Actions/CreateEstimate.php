<?php

namespace App\Actions;

use App\Models\Business;
use App\Models\Estimate;
use App\Support\EstimateTotals;
use Illuminate\Support\Facades\DB;

class CreateEstimate
{
    public function handle(Business $business, array $attributes): Estimate
    {
        return DB::transaction(function () use ($business, $attributes): Estimate {
            Business::lockForUpdate()->findOrFail($business->id);
            $number = (int) Estimate::forBusiness($business)->max('number') + 1;
            $totals = EstimateTotals::fromAttributes($attributes);

            $estimate = Estimate::create([
                ...collect($attributes)->except('items')->all(),
                'business_id' => $business->id,
                'number' => $number,
                ...$totals['columns'],
            ]);
            $estimate->items()->createMany($totals['items']);

            return $estimate;
        });
    }
}
