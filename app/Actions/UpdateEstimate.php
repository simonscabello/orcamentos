<?php

namespace App\Actions;

use App\Models\Estimate;
use App\Support\EstimateTotals;
use Illuminate\Support\Facades\DB;

class UpdateEstimate
{
    public function handle(Estimate $estimate, array $attributes): Estimate
    {
        return DB::transaction(function () use ($estimate, $attributes): Estimate {
            // Trava o orçamento: sem isso, duas gravações simultâneas intercalavam o
            // apagar/recriar dos itens e o total deixava de bater com a soma.
            $estimate = Estimate::lockForUpdate()->findOrFail($estimate->id);
            $totals = EstimateTotals::fromAttributes($attributes);
            $estimate->update([
                ...collect($attributes)->except('items')->all(),
                ...$totals['columns'],
            ]);
            $estimate->items()->delete();
            $estimate->items()->createMany($totals['items']);

            return $estimate;
        });
    }
}
