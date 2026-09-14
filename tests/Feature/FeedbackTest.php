<?php

use App\Models\User;

it('returns a clear Portuguese validation message when a customer is incomplete', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/customers/create')
        ->post('/customers', ['name' => ''])
        ->assertRedirect('/customers/create')
        ->assertSessionHasErrors(['name' => 'Informe o nome do cliente.']);
});

it('flashes a success toast after creating a customer', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/customers', ['name' => 'Eli José'])
        ->assertRedirect()
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Cliente salvo com sucesso.',
        ]);
});
