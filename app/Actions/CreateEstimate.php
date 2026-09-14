<?php

namespace App\Actions;

use App\Models\Business;
use App\Models\Estimate;
use Illuminate\Support\Facades\DB;

class CreateEstimate
{
    public function handle(Business $business, array $attributes): Estimate
    {
        return DB::transaction(function () use ($business, $attributes): Estimate {
            Business::lockForUpdate()->findOrFail($business->id);
            $number = (int) Estimate::forBusiness($business)->max('number') + 1;
            $items = $attributes['items'];
            $total = array_sum(array_column($items, 'amount'));

            $estimate = Estimate::create([
                ...collect($attributes)->except('items')->all(),
                'business_id' => $business->id,
                'number' => $number,
                'total' => $total,
            ]);
            $estimate->items()->createMany($items);

            return $estimate;
        });
    }
}
