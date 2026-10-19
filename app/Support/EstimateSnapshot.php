<?php

namespace App\Support;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\Vehicle;

/**
 * Cópia do conteúdo de um orçamento (com cliente, veículo e itens da época),
 * usada para guardar versões e para gerar o PDF de uma versão anterior.
 */
class EstimateSnapshot
{
    /** Campos que não fazem parte do conteúdo enviado ao cliente. */
    private const IGNORED_IN_COMPARISON = ['status', 'version'];

    /**
     * @return array<string, mixed>
     */
    public static function capture(Estimate $estimate): array
    {
        $estimate->loadMissing(['business', 'customer', 'vehicle', 'items']);

        return [
            ...$estimate->only([
                'number', 'version', 'status', 'notes', 'total', 'discount_type', 'discount_value',
                'discount_amount', 'insurer_name', 'claim_number', 'deductible',
            ]),
            'date' => $estimate->date?->toDateString(),
            'valid_until' => $estimate->valid_until?->toDateString(),
            'business' => $estimate->business->only(['name', 'phone', 'document', 'address']),
            'customer' => $estimate->customer->only(['id', 'name', 'phone']),
            'vehicle' => $estimate->vehicle->only(['id', 'model', 'plate', 'color']),
            'items' => $estimate->items
                ->map(fn (EstimateItem $item) => $item->only(['description', 'type', 'quantity', 'unit_amount', 'amount']))
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public static function contentChanged(array $before, array $after): bool
    {
        return self::normalize(array_diff_key($before, array_flip(self::IGNORED_IN_COMPARISON)))
            !== self::normalize(array_diff_key($after, array_flip(self::IGNORED_IN_COMPARISON)));
    }

    /**
     * Guarda no orçamento o conteúdo atual (o que o cliente recebe se o PDF for enviado agora).
     */
    public static function store(Estimate $estimate): void
    {
        $estimate->forceFill(['content_snapshot' => self::capture($estimate->refresh())])->save();
    }

    /**
     * Ordena as chaves para a comparação não depender da ordem vinda do JSON.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private static function normalize(array $data): array
    {
        ksort($data);

        return array_map(fn ($value) => is_array($value) ? self::normalize($value) : $value, $data);
    }

    /**
     * Monta um orçamento em memória (não salvo) a partir da cópia, para o PDF.
     *
     * @param  array<string, mixed>  $snapshot
     */
    public static function toEstimate(array $snapshot, Business $business): Estimate
    {
        $estimate = new Estimate(collect($snapshot)->except(['business', 'customer', 'vehicle', 'items'])->all());
        $estimate->version = $snapshot['version'];
        // Versões guardam os dados da oficina da época; o parâmetro só cobre cópias sem eles.
        $estimate->setRelation('business', isset($snapshot['business']) ? new Business($snapshot['business']) : $business);
        $estimate->setRelation('customer', new Customer($snapshot['customer']));
        $estimate->setRelation('vehicle', new Vehicle($snapshot['vehicle']));
        $estimate->setRelation('items', collect($snapshot['items'])->map(fn (array $item) => new EstimateItem($item)));

        return $estimate;
    }
}
