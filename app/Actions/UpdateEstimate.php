<?php

namespace App\Actions;

use App\Models\Estimate;
use Illuminate\Support\Facades\DB;

class UpdateEstimate
{
    public function handle(Estimate $estimate, array $attributes): Estimate
    {
        return DB::transaction(function () use ($estimate, $attributes): Estimate {
            // Trava o orçamento: sem isso, duas gravações simultâneas intercalavam o
            // apagar/recriar dos itens e o total deixava de bater com a soma.
            $estimate = Estimate::lockForUpdate()->findOrFail($estimate->id);
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
