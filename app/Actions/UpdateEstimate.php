<?php

namespace App\Actions;

use App\Models\Estimate;
use Illuminate\Support\Facades\DB;

class UpdateEstimate
{
    public function handle(Estimate $estimate, array $attributes): Estimate
    {
        return DB::transaction(function () use ($estimate, $attributes): Estimate {
            $items = $attributes['items'];
            $estimate->update([
                ...collect($attributes)->except('items')->all(),
                'total' => array_sum(array_column($items, 'amount')),
            ]);
            $estimate->items()->delete();
            $estimate->items()->createMany($items);

            return $estimate;
        });
    }
}
