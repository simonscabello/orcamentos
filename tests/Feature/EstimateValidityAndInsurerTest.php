<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

function validityVehicle(Business $business): array
{
    $customer = Customer::factory()->create(['business_id' => $business->id]);
    $vehicle = Vehicle::create(['business_id' => $business->id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234']);

    return [$customer, $vehicle];
}

function validityPayload(Customer $customer, Vehicle $vehicle, array $extra = []): array
{
    return [
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'date' => '2026-10-19',
        'status' => 'draft',
        'notes' => null,
        'items' => [['description' => 'Pintura', 'amount' => 45000]],
        ...$extra,
    ];
}

function pdfEstimate(array $attributes = []): Estimate
{
    $estimate = new Estimate(['number' => 7, 'total' => 45000, 'date' => '2026-10-19', ...$attributes]);
    $estimate->setRelation('business', new Business(['name' => 'Funilaria Central']));
    $estimate->setRelation('customer', new Customer(['name' => 'Simão José']));
    $estimate->setRelation('vehicle', new Vehicle(['model' => 'Toyota Prius']));
    $estimate->setRelation('items', collect([new EstimateItem(['description' => 'Pintura', 'amount' => 45000])]));

    return $estimate;
}

it('saves the validity and the insurer data of an estimate', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', validityPayload($customer, $vehicle, [
            'valid_until' => '2026-10-26',
            'insurer_name' => 'Porto Seguro',
            'claim_number' => 'SIN-2026/00123',
            'deductible' => 250000,
        ]))
        ->assertSessionHasNoErrors();

    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    expect($estimate->valid_until->toDateString())->toBe('2026-10-26')
        ->and($estimate->insurer_name)->toBe('Porto Seguro')
        ->and($estimate->claim_number)->toBe('SIN-2026/00123')
        ->and($estimate->deductible)->toBe(250000)
        ->and($estimate->total)->toBe(45000);

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", validityPayload($customer, $vehicle, [
            'valid_until' => '',
            'insurer_name' => '',
            'claim_number' => '',
            'deductible' => '',
        ]))
        ->assertSessionHasNoErrors();

    expect($estimate->fresh())
        ->valid_until->toBeNull()
        ->insurer_name->toBeNull()
        ->claim_number->toBeNull()
        ->deductible->toBeNull();
});

it('keeps validity and insurer optional', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', validityPayload($customer, $vehicle))
        ->assertSessionHasNoErrors();

    expect(Estimate::forBusiness($user->business)->firstOrFail())
        ->valid_until->toBeNull()
        ->insurer_name->toBeNull();
});

it('rejects invalid validity and deductible values', function (array $extra, string $field, string $message) {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);

    $this->actingAs($user)
        ->from('/estimates/create')
        ->post('/estimates', validityPayload($customer, $vehicle, $extra))
        ->assertSessionHasErrors([$field => $message]);

    expect(Estimate::count())->toBe(0);
})->with([
    'validade antes da data' => [['valid_until' => '2026-10-18'], 'valid_until', 'A validade não pode ser anterior à data do orçamento.'],
    'validade inválida' => [['valid_until' => '2026-02-31'], 'valid_until', 'Informe uma data de validade válida.'],
    'franquia negativa' => [['deductible' => -1], 'deductible', 'A franquia não pode ser negativa.'],
    'franquia digitada inválida' => [['deductible' => '-10,00'], 'deductible', 'Informe um valor de franquia válido.'],
    'franquia com centavos quebrados' => [['deductible' => '10.5'], 'deductible', 'Informe um valor de franquia válido.'],
    'sinistro longo' => [['claim_number' => str_repeat('9', 61)], 'claim_number', 'O número do sinistro é muito longo.'],
]);

it('accepts a validity on the same day as the estimate', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);

    $this->actingAs($user)
        ->post('/estimates', validityPayload($customer, $vehicle, ['valid_until' => '2026-10-19']))
        ->assertSessionHasNoErrors();
});

it('copies the insurer data but not the validity when duplicating', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);
    $this->actingAs($user)->post('/estimates', validityPayload($customer, $vehicle, [
        'valid_until' => '2026-10-26',
        'insurer_name' => 'Porto Seguro',
        'claim_number' => 'SIN-1',
        'deductible' => 150000,
    ]));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->get("/estimates/create?duplicate={$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('duplicateOf.insurer_name', 'Porto Seguro')
            ->where('duplicateOf.claim_number', 'SIN-1')
            ->where('duplicateOf.deductible', 150000)
            ->missing('duplicateOf.valid_until')
        );
});

it('prints the validity and the insurer data in the PDF only when filled', function () {
    $html = view('pdf.estimate', ['estimate' => pdfEstimate([
        'valid_until' => '2026-10-26',
        'insurer_name' => 'Porto Seguro',
        'claim_number' => 'SIN-2026/00123',
        'deductible' => 250000,
    ])])->render();

    expect($html)->toContain('Válido até:</span> 26/10/2026')
        ->toContain('Seguradora:</span> Porto Seguro')
        ->toContain('Sinistro:</span> SIN-2026/00123')
        ->toContain('Franquia:</span> R$ 2.500,00');

    $zeroClaim = view('pdf.estimate', ['estimate' => pdfEstimate(['claim_number' => '0'])])->render();

    expect($zeroClaim)->toContain('Sinistro:</span> 0');

    $plain = view('pdf.estimate', ['estimate' => pdfEstimate()])->render();

    expect($plain)->not->toContain('Válido até')
        ->not->toContain('Seguradora')
        ->not->toContain('Sinistro')
        ->not->toContain('Franquia');
});

it('shows the validity and the insurer data on the estimate page', function () {
    $user = User::factory()->create();
    [$customer, $vehicle] = validityVehicle($user->business);
    $this->actingAs($user)->post('/estimates', validityPayload($customer, $vehicle, [
        'valid_until' => '2026-10-26',
        'insurer_name' => 'Porto Seguro',
    ]));
    $estimate = Estimate::forBusiness($user->business)->firstOrFail();

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('estimate.valid_until', '2026-10-26')
            ->where('estimate.insurer_name', 'Porto Seguro')
            ->where('estimate.deductible', null)
        );
});
