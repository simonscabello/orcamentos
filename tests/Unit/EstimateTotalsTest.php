<?php

use App\Support\EstimateTotals;

it('keeps manual items as typed and sums them', function () {
    $totals = EstimateTotals::calculate([
        ['description' => 'Pintura', 'amount' => 45000],
        ['description' => 'Polimento', 'amount' => 12050],
    ]);

    expect($totals['items'][0])->toMatchArray(['amount' => 45000, 'quantity' => null, 'unit_amount' => null])
        ->and($totals['subtotal'])->toBe(57050)
        ->and($totals['discount_amount'])->toBe(0)
        ->and($totals['total'])->toBe(57050);
});

it('computes the item amount from quantity and unit price, ignoring the typed amount', function () {
    $totals = EstimateTotals::calculate([
        ['description' => 'Parafuso', 'type' => 'part', 'quantity' => 3, 'unit_amount' => 1999, 'amount' => 1],
        ['description' => 'Mão de obra', 'type' => 'labor', 'amount' => 30000],
    ]);

    expect($totals['items'][0]['amount'])->toBe(5997)
        ->and($totals['subtotal'])->toBe(35997)
        ->and($totals['by_type'])->toBe(['part' => 5997, 'labor' => 30000, 'none' => 0]);
});

it('applies a fixed discount in cents', function () {
    $totals = EstimateTotals::calculate([['description' => 'Pintura', 'amount' => 45000]], 'fixed', 5050);

    expect($totals['discount_amount'])->toBe(5050)
        ->and($totals['total'])->toBe(39950);
});

it('rounds percent discounts half up to the cent', function (int $subtotal, int $basisPoints, int $discount) {
    $totals = EstimateTotals::calculate([['description' => 'Item', 'amount' => $subtotal]], 'percent', $basisPoints);

    expect($totals['discount_amount'])->toBe($discount)
        ->and($totals['total'])->toBe($subtotal - $discount);
})->with([
    '10% de R$ 333,33' => [33333, 1000, 3333],
    '15% de R$ 100,01' => [10001, 1500, 1500],
    '1% de R$ 0,50 (meio centavo sobe)' => [50, 100, 1],
    '1% de R$ 0,49' => [49, 100, 0],
    '5,5% de R$ 1.234,56' => [123456, 550, 6790],
    '100% (cortesia)' => [45000, 10000, 45000],
]);

it('handles the largest allowed estimate without losing precision', function () {
    $items = array_fill(0, 100, ['description' => 'Item', 'quantity' => 999, 'unit_amount' => 1001001]);

    $totals = EstimateTotals::calculate($items, 'percent', 3333);

    expect($totals['subtotal'])->toBe(99_999_999_900)
        ->and($totals['discount_amount'])->toBe(intdiv($totals['subtotal'] * 3333 + 5000, 10000));
});
