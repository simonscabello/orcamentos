<?php

namespace App\Support;

/**
 * Cálculo dos valores do orçamento, sempre em centavos inteiros e sempre no servidor.
 *
 * Item "manual" usa o `amount` digitado. Item com quantidade e valor unitário tem o
 * `amount` recalculado (quantidade × unitário), ignorando o que veio do request.
 * O desconto é fixo (centavos) ou percentual (centésimos de ponto: 550 = 5,5%),
 * arredondado para o centavo mais próximo, com meio centavo para cima.
 */
class EstimateTotals
{
    public const DISCOUNT_FIXED = 'fixed';

    public const DISCOUNT_PERCENT = 'percent';

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{items: array<int, array<string, mixed>>, subtotal: int, discount_amount: int, total: int, by_type: array{part: int, labor: int, none: int}}
     */
    public static function calculate(array $items, ?string $discountType = null, ?int $discountValue = null): array
    {
        $byType = ['part' => 0, 'labor' => 0, 'none' => 0];

        $items = array_map(function (array $item) use (&$byType): array {
            $quantity = isset($item['quantity'], $item['unit_amount']) ? (int) $item['quantity'] : null;
            $unitAmount = $quantity !== null ? (int) $item['unit_amount'] : null;
            $amount = $quantity !== null ? $quantity * $unitAmount : (int) $item['amount'];
            $type = $item['type'] ?? null;

            $byType[$type ?? 'none'] += $amount;

            return [...$item, 'type' => $type, 'quantity' => $quantity, 'unit_amount' => $unitAmount, 'amount' => $amount];
        }, $items);

        $subtotal = array_sum(array_column($items, 'amount'));
        $discountAmount = self::discount($subtotal, $discountType, $discountValue);

        return [
            'items' => $items,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'total' => $subtotal - $discountAmount,
            'by_type' => $byType,
        ];
    }

    /**
     * Calcula a partir dos dados validados do orçamento e devolve as colunas a gravar.
     * Sem tipo de desconto, o valor do desconto é descartado.
     *
     * @param  array<string, mixed>  $attributes
     * @return array{items: array<int, array<string, mixed>>, columns: array{discount_type: ?string, discount_value: ?int, discount_amount: int, total: int}}
     */
    public static function fromAttributes(array $attributes): array
    {
        $discountType = $attributes['discount_type'] ?? null;
        $discountValue = $discountType ? (int) $attributes['discount_value'] : null;
        $totals = self::calculate($attributes['items'], $discountType, $discountValue);

        return [
            'items' => $totals['items'],
            'columns' => [
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'discount_amount' => $totals['discount_amount'],
                'total' => $totals['total'],
            ],
        ];
    }

    public static function discount(int $subtotal, ?string $discountType, ?int $discountValue): int
    {
        return match ($discountType) {
            self::DISCOUNT_FIXED => (int) $discountValue,
            self::DISCOUNT_PERCENT => intdiv($subtotal * (int) $discountValue + 5000, 10000),
            default => 0,
        };
    }
}
