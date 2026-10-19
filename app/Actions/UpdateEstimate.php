<?php

namespace App\Actions;

use App\Models\Estimate;
use App\Support\EstimateSnapshot;
use App\Support\EstimateTotals;
use App\Support\VehicleOwnership;
use Illuminate\Support\Facades\DB;

class UpdateEstimate
{
    public function handle(Estimate $estimate, array $attributes): Estimate
    {
        return DB::transaction(function () use ($estimate, $attributes): Estimate {
            // Trava o orçamento: sem isso, duas gravações simultâneas intercalavam o
            // apagar/recriar dos itens e o total deixava de bater com a soma.
            $estimate = Estimate::lockForUpdate()->findOrFail($estimate->id);
            VehicleOwnership::lockAndCheck($estimate->business_id, $attributes['vehicle_id'], $attributes['customer_id']);
            $wasSent = $estimate->status === 'sent';
            // O conteúdo da última gravação/envio, não o cadastro atual de cliente e veículo.
            $before = $estimate->content_snapshot ?? EstimateSnapshot::capture($estimate);
            $totals = EstimateTotals::fromAttributes($attributes);
            $estimate->update([
                ...collect($attributes)->except('items')->all(),
                ...$totals['columns'],
            ]);
            $estimate->items()->delete();
            $estimate->items()->createMany($totals['items']);

            // Editar um orçamento já enviado guarda o que o cliente recebeu como versão anterior.
            $after = EstimateSnapshot::capture($estimate->refresh());

            if ($wasSent && EstimateSnapshot::contentChanged($before, $after)) {
                $estimate->versions()->create([
                    'version' => $before['version'],
                    'total' => $before['total'],
                    'snapshot' => $before,
                ]);
                $estimate->forceFill(['version' => $before['version'] + 1])->save();
            }

            EstimateSnapshot::store($estimate);

            return $estimate;
        });
    }
}
