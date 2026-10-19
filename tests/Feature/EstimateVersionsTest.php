<?php

use App\Models\Customer;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\EstimateSnapshot;
use Inertia\Testing\AssertableInertia as Assert;

function versionsSetup(User $user, string $status = 'sent'): array
{
    $customer = Customer::factory()->create(['business_id' => $user->business_id, 'name' => 'Ana Lima']);
    $vehicle = Vehicle::create(['business_id' => $user->business_id, 'customer_id' => $customer->id, 'model' => 'Ford Fiesta', 'plate' => 'ABC1234']);
    $payload = ['customer_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'date' => '2026-10-19', 'status' => $status, 'items' => [['description' => 'Pintura', 'amount' => 45000]]];

    test()->actingAs($user)->post('/estimates', $payload)->assertSessionHasNoErrors();

    return [Estimate::forBusiness($user->business_id)->firstOrFail(), $payload, $customer];
}

it('keeps the previous content as a version when a sent estimate is edited', function () {
    $user = User::factory()->create();
    [$estimate, $payload, $customer] = versionsSetup($user);

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", [...$payload, 'items' => [['description' => 'Pintura completa', 'amount' => 50000]]])
        ->assertSessionHasNoErrors();

    $estimate->refresh();
    $version = $estimate->versions()->sole();

    expect($estimate->version)->toBe(2)
        ->and($estimate->total)->toBe(50000)
        ->and($version->version)->toBe(1)
        ->and($version->total)->toBe(45000)
        ->and($version->snapshot['items'])->toBe([['description' => 'Pintura', 'type' => null, 'quantity' => null, 'unit_amount' => null, 'amount' => 45000]])
        ->and($version->snapshot['customer']['name'])->toBe('Ana Lima');

    // O cliente renomeado depois não altera o que ficou registrado na versão.
    $customer->update(['name' => 'Ana Lima Souza']);
    expect($version->fresh()->snapshot['customer']['name'])->toBe('Ana Lima');

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", [...$payload, 'items' => [['description' => 'Pintura completa', 'amount' => 52000]]]);

    expect($estimate->fresh()->version)->toBe(3)
        ->and($estimate->versions()->pluck('total', 'version')->all())->toBe([1 => 45000, 2 => 50000]);
});

it('does not create versions while the estimate is a draft', function () {
    $user = User::factory()->create();
    [$estimate, $payload] = versionsSetup($user, 'draft');

    $this->actingAs($user)
        ->put("/estimates/{$estimate->id}", [...$payload, 'items' => [['description' => 'Pintura', 'amount' => 50000]]]);

    expect($estimate->fresh()->version)->toBe(1)
        ->and($estimate->versions()->count())->toBe(0);
});

it('does not create a version when a sent estimate is saved without changes', function () {
    $user = User::factory()->create();
    [$estimate, $payload] = versionsSetup($user);

    $this->actingAs($user)->put("/estimates/{$estimate->id}", $payload)->assertSessionHasNoErrors();
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'status' => 'draft'])->assertSessionHasNoErrors();

    expect($estimate->fresh()->version)->toBe(1)
        ->and($estimate->versions()->count())->toBe(0);
});

it('starts a duplicated estimate at version one', function () {
    $user = User::factory()->create();
    [$estimate, $payload] = versionsSetup($user);
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'notes' => 'Revisado']);
    expect($estimate->fresh()->version)->toBe(2);

    $duplicateOf = null;
    $this->actingAs($user)
        ->get("/estimates/create?duplicate={$estimate->id}")
        ->assertInertia(function (Assert $page) use (&$duplicateOf) {
            $duplicateOf = $page->toArray()['props']['duplicateOf'];
        });

    $this->actingAs($user)->post('/estimates', [
        ...$payload,
        'notes' => $duplicateOf['notes'],
        'items' => $duplicateOf['items'],
    ])->assertSessionHasNoErrors();

    $copy = Estimate::forBusiness($user->business_id)->where('number', 2)->firstOrFail();

    expect($copy->version)->toBe(1)
        ->and($copy->notes)->toBe('Revisado')
        ->and($copy->versions()->count())->toBe(0);
});

it('archives what was sent even if the customer changed before the edit', function () {
    $user = User::factory()->create();
    [$estimate, $payload, $customer] = versionsSetup($user);
    $customer->update(['name' => 'Nome Novo']);

    // O PDF agora sairia com o nome novo: salvar já registra a versão que o cliente recebeu.
    $this->actingAs($user)->put("/estimates/{$estimate->id}", $payload);

    expect($estimate->fresh()->version)->toBe(2)
        ->and($estimate->versions()->sole()->snapshot['customer']['name'])->toBe('Ana Lima');
});

it('takes the content at the moment the estimate is marked as sent', function () {
    $user = User::factory()->create();
    [$estimate, $payload, $customer] = versionsSetup($user, 'draft');
    $customer->update(['name' => 'Nome Corrigido']);

    $this->actingAs($user)->patch("/estimates/{$estimate->id}/status", ['status' => 'sent']);
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'status' => 'sent', 'notes' => 'Revisado']);

    expect($estimate->versions()->sole()->snapshot['customer']['name'])->toBe('Nome Corrigido');
});

it('keeps the business data of the time in old versions', function () {
    $user = User::factory()->create();
    $user->business->update(['name' => 'Funilaria Antiga']);
    [$estimate, $payload] = versionsSetup($user);
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'notes' => 'Revisado']);
    $user->business->update(['name' => 'Funilaria Nova']);

    $old = EstimateSnapshot::toEstimate($estimate->versions()->sole()->snapshot, $user->business->fresh());

    expect(view('pdf.estimate', ['estimate' => $old])->render())
        ->toContain('Funilaria Antiga')
        ->not->toContain('Funilaria Nova');
});

it('does not send the internal content copy to the pages', function () {
    $user = User::factory()->create();
    [$estimate] = versionsSetup($user);

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}/edit")
        ->assertInertia(fn (Assert $page) => $page->missing('estimate.content_snapshot'));
});

it('lists the versions on the estimate page and prints the current version in the PDF', function () {
    $user = User::factory()->create();
    [$estimate, $payload] = versionsSetup($user);
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'items' => [['description' => 'Pintura completa', 'amount' => 50000]]]);

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('estimate.version', 2)
            ->has('estimate.versions', 1)
            ->where('estimate.versions.0.version', 1)
            ->where('estimate.versions.0.total', 45000)
            ->missing('estimate.versions.0.snapshot')
        );

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}/pdf")
        ->assertOk()
        ->assertDownload('orcamento-001-v2.pdf');

    $html = view('pdf.estimate', ['estimate' => $estimate->fresh()->load(['customer', 'vehicle', 'items', 'business'])])->render();
    expect($html)->toContain('ORÇAMENTO Nº 001 · VERSÃO 2');
});

it('generates the PDF of a previous version from its own copy', function () {
    $user = User::factory()->create();
    [$estimate, $payload, $customer] = versionsSetup($user);
    $this->actingAs($user)->put("/estimates/{$estimate->id}", [...$payload, 'items' => [['description' => 'Pintura completa', 'amount' => 50000]]]);
    $customer->update(['name' => 'Outro Nome']);

    $this->actingAs($user)
        ->get("/estimates/{$estimate->id}/versions/1/pdf")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertDownload('orcamento-001.pdf');

    $html = view('pdf.estimate', ['estimate' => EstimateSnapshot::toEstimate($estimate->versions()->sole()->snapshot, $user->business)])->render();
    expect($html)->toContain('Ana Lima')
        ->toContain('Pintura')
        ->toContain('R$ 450,00')
        ->not->toContain('Outro Nome')
        ->not->toContain('VERSÃO');

    $this->actingAs($user)->get("/estimates/{$estimate->id}/versions/9/pdf")->assertNotFound();
});

it('does not expose versions of another business estimate', function () {
    $owner = User::factory()->create();
    [$estimate, $payload] = versionsSetup($owner);
    $this->actingAs($owner)->put("/estimates/{$estimate->id}", [...$payload, 'notes' => 'Revisado']);

    $this->actingAs(User::factory()->create())
        ->get("/estimates/{$estimate->id}/versions/1/pdf")
        ->assertNotFound();
});
