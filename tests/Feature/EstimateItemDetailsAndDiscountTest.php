<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function detailsVehicle(Business $business): array
{
    $customer = Customer::factory()->create(['business_id' => $business->id]);
    $vehicle = Vehicle::create(['business_id' => $business->id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta']);

    return [$customer, $vehicle];
}

function detailsPayload(Customer $customer, Vehicle $vehicle, array $items, array $extra = []): array
{
    return ['customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'date' => '2026-10-19', 'status' => 'draft', 'items' => $items, ...$extra];
}

it('computes item amounts from quantity and unit price on the server', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', detailsPayload($customer, $vehicle, [
            ['description' => 'Parafuso', 'type' => 'part', 'quantity' => 3, 'unit_amount' => 1999, 'amount' => 1],
            ['description' => 'Mão de obra', 'type' => 'labor', 'amount' => 30000],
            ['description' => 'Polimento', 'amount' => 12050],
        ], ['total' => 1]))
        ->assertSessionHasNoErrors();

    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    expect($estimate->total)->toBe(48047)
        ->and($estimate->discount_amount)->toBe(0)
        ->and($estimate->items->map->only(['type', 'quantity', 'unit_amount', 'amount'])->all())->toBe([
            ['type' => 'part', 'quantity' => 3, 'unit_amount' => 1999, 'amount' => 5997],
            ['type' => 'labor', 'quantity' => null, 'unit_amount' => null, 'amount' => 30000],
            ['type' => null, 'quantity' => null, 'unit_amount' => null, 'amount' => 12050],
        ]);
});

it('applies fixed and percent discounts and recalculates them on update', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);
    $items = [['description' => 'Pintura', 'amount' => 123456]];

    $this->actingAs($user)
        ->post('/estimates', detailsPayload($customer, $vehicle, $items, ['discount_type' => 'percent', 'discount_value' => 550, 'discount_amount' => 1]))
        ->assertSessionHasNoErrors();
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    expect($estimate->discount_amount)->toBe(6790)
        ->and($estimate->total)->toBe(116666);

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", detailsPayload($customer, $vehicle, $items, ['discount_type' => 'fixed', 'discount_value' => 23456]))
        ->assertSessionHasNoErrors();

    expect($estimate->fresh())
        ->discount_type->toBe('fixed')
        ->discount_amount->toBe(23456)
        ->total->toBe(100000);

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", detailsPayload($customer, $vehicle, $items, ['discount_type' => '', 'discount_value' => 999]))
        ->assertSessionHasNoErrors();

    expect($estimate->fresh())
        ->discount_type->toBeNull()
        ->discount_value->toBeNull()
        ->discount_amount->toBe(0)
        ->total->toBe(123456);
});

it('allows a full discount but not more than the subtotal', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);
    $items = [['description' => 'Pintura', 'amount' => 45000]];

    $this->actingAs($user)
        ->post('/estimates', detailsPayload($customer, $vehicle, $items, ['discount_type' => 'fixed', 'discount_value' => 45000]))
        ->assertSessionHasNoErrors();

    expect(Estimate::forBusiness($user->business)->firstOrFail()->total)->toBe(0);
});

it('rejects inconsistent item details and discounts', function (array $items, array $extra, string $field, string $message) {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);

    $this->actingAs($user)
        ->from('/estimates/create')
        ->post('/estimates', detailsPayload($customer, $vehicle, $items, $extra))
        ->assertSessionHasErrors([$field => $message]);

    expect(Estimate::count())->toBe(0);
})->with([
    'quantidade sem unitário' => [[['description' => 'Peça', 'quantity' => 2, 'amount' => 100]], [], 'items.0.unit_amount', 'Informe o valor unitário.'],
    'unitário sem quantidade' => [[['description' => 'Peça', 'unit_amount' => 100]], [], 'items.0.quantity', 'Informe a quantidade.'],
    'quantidade fracionada' => [[['description' => 'Peça', 'quantity' => 1.5, 'unit_amount' => 100]], [], 'items.0.quantity', 'A quantidade deve ser um número inteiro.'],
    'tipo inválido' => [[['description' => 'Peça', 'type' => 'gift', 'amount' => 100]], [], 'items.0.type', 'Selecione um tipo de item válido.'],
    'item caro demais' => [[['description' => 'Peça', 'quantity' => 999, 'unit_amount' => 1001002]], [], 'items.0.unit_amount', 'O valor total do item é muito alto.'],
    'desconto sem valor' => [[['description' => 'Pintura', 'amount' => 100]], ['discount_type' => 'fixed'], 'discount_value', 'Informe o valor do desconto.'],
    'desconto acima do subtotal' => [[['description' => 'Pintura', 'amount' => 100]], ['discount_type' => 'fixed', 'discount_value' => 101], 'discount_value', 'O desconto não pode ser maior que o subtotal.'],
    'desconto acima de 100%' => [[['description' => 'Pintura', 'amount' => 100]], ['discount_type' => 'percent', 'discount_value' => 10001], 'discount_value', 'O desconto não pode passar de 100%.'],
    'unitário digitado com sinal' => [[['description' => 'Peça', 'quantity' => 2, 'unit_amount' => '+100']], [], 'items.0.unit_amount', 'Informe um valor unitário válido.'],
    'quantidade em texto' => [[['description' => 'Peça', 'quantity' => '2', 'unit_amount' => 100]], [], 'items.0.quantity', 'A quantidade deve ser um número inteiro.'],
    'desconto digitado com sinal' => [[['description' => 'Pintura', 'amount' => 100]], ['discount_type' => 'percent', 'discount_value' => '+10'], 'discount_value', 'Informe um desconto válido.'],
    'tipo de desconto inválido' => [[['description' => 'Pintura', 'amount' => 100]], ['discount_type' => 'gift', 'discount_value' => 1], 'discount_type', 'Selecione um tipo de desconto válido.'],
]);

it('accepts the form payload with explicit nulls for manual and detailed items', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', detailsPayload($customer, $vehicle, [
            ['description' => 'Pintura', 'type' => null, 'quantity' => null, 'unit_amount' => null, 'amount' => 45000],
            ['description' => 'Parafuso', 'type' => 'part', 'quantity' => 2, 'unit_amount' => 500, 'amount' => null],
        ], ['discount_type' => null, 'discount_value' => null]))
        ->assertSessionHasNoErrors();

    expect(Estimate::forBusiness($user->business)->firstOrFail()->total)->toBe(46000);
});

it('still requires the amount of a manual item', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);

    $this->actingAs($user)
        ->from('/estimates/create')
        ->post('/estimates', detailsPayload($customer, $vehicle, [
            ['description' => 'Pintura', 'quantity' => null, 'unit_amount' => null, 'amount' => null],
        ]))
        ->assertSessionHasErrors(['items.0.amount' => 'Informe o valor do item.']);
});

it('shows and edits an estimate saved before item details and discounts existed', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);
    // Como os registros antigos ficam após a migration: colunas novas nulas e desconto zero.
    $estimate = Estimate::create(['business_id' => $user->business_id, 'customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'number' => 1, 'status' => 'sent', 'total' => 57050, 'date' => '2026-09-14']);
    $estimate->items()->createMany([['description' => 'Pintura', 'amount' => 45000], ['description' => 'Polimento', 'amount' => 12050]]);

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}/edit")
        ->assertInertia(fn (Assert $page) => $page
            ->where('estimate.discount_type', null)
            ->where('estimate.discount_amount', 0)
            ->where('estimate.items.0.quantity', null)
        );
    $this->actingAs($user)->get("/estimates/{$estimate->id}/pdf")->assertOk();

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", detailsPayload($customer, $vehicle, [
            ['description' => 'Pintura', 'type' => null, 'quantity' => null, 'unit_amount' => null, 'amount' => 45000],
            ['description' => 'Polimento', 'type' => null, 'quantity' => null, 'unit_amount' => null, 'amount' => 12050],
        ], ['discount_type' => null, 'discount_value' => null]))
        ->assertSessionHasNoErrors();

    expect($estimate->fresh())->total->toBe(57050)->discount_amount->toBe(0)->number->toBe(1);
});

it('keeps existing manual estimates unchanged', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', detailsPayload($customer, $vehicle, [['description' => 'Pintura', 'amount' => 45000]]))
        ->assertSessionHasNoErrors();

    expect(Estimate::forBusiness($user->business)->firstOrFail())
        ->total->toBe(45000)
        ->discount_type->toBeNull()
        ->discount_amount->toBe(0);
});

it('copies item details and the discount when duplicating', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);
    $this->actingAs($user)->post('/estimates', detailsPayload($customer, $vehicle, [
        ['description' => 'Parafuso', 'type' => 'part', 'quantity' => 3, 'unit_amount' => 1999],
    ], ['discount_type' => 'percent', 'discount_value' => 1000]));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->get("/estimates/create?duplicate={$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('duplicateOf.discount_type', 'percent')
            ->where('duplicateOf.discount_value', 1000)
            ->where('duplicateOf.items.0.type', 'part')
            ->where('duplicateOf.items.0.quantity', 3)
            ->where('duplicateOf.items.0.unit_amount', 1999)
            ->where('duplicateOf.items.0.amount', 5997)
        );
});

it('prints item details, totals by type and the discount in the PDF', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = detailsVehicle($user->business);
    $this->actingAs($user)->post('/estimates', detailsPayload($customer, $vehicle, [
        ['description' => 'Parafuso', 'type' => 'part', 'quantity' => 3, 'unit_amount' => 1999],
        ['description' => 'Funilaria', 'type' => 'labor', 'amount' => 30000],
        ['description' => 'Polimento', 'amount' => 12050],
    ], ['discount_type' => 'percent', 'discount_value' => 550]));
    $estimate = Estimate::forBusiness($user->business)->with(['customer', 'vehicle', 'items', 'business'])->firstOrFail();

    $html = view('pdf.estimate', ['estimate' => $estimate])->render();

    expect($html)->toContain('Peça · 3 × R$ 19,99')
        ->toContain('Mão de obra</span>')
        ->toMatch('/<td>Peças<\/td>\s*<td class="amount">R\$ 59,97<\/td>/')
        ->toMatch('/<td>Mão de obra<\/td>\s*<td class="amount">R\$ 300,00<\/td>/')
        ->toMatch('/<td>Subtotal<\/td>\s*<td class="amount">R\$ 480,47<\/td>/')
        ->toContain('Desconto (5,5%)')
        ->toContain('− R$ 26,43')
        ->toContain('R$ 454,04');

    $plain = view('pdf.estimate', ['estimate' => tap($estimate->replicate(), function (Estimate $copy) use ($estimate) {
        $copy->discount_amount = 0;
        $copy->total = 48047;
        $copy->setRelation('items', $estimate->items->map(fn ($item) => tap($item->replicate(), fn ($i) => $i->fill(['type' => null, 'quantity' => null, 'unit_amount' => null]))));
    })])->render();

    expect($plain)->not->toContain('Subtotal')
        ->not->toContain('Desconto')
        ->not->toContain('Peças')
        ->not->toContain('item-meta"')
        ->toContain('R$ 480,47');
});
