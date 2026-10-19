<?php

use App\Models\User;

it('updates the business shown on the estimates', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put('/settings/business', [
            'name' => 'Funilaria Central',
            'owner_name' => 'Ana',
            'phone' => '27999990000',
            'document' => '23682756000128',
            'address' => 'Rua Campina Grande, 39',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/business');

    expect($user->business->fresh())
        ->name->toBe('Funilaria Central')
        ->address->toBe('Rua Campina Grande, 39');
});

it('rejects an address longer than the column allows', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/business')
        ->put('/settings/business', ['name' => 'Funilaria Central', 'address' => str_repeat('a', 256)])
        ->assertSessionHasErrors(['address' => 'O endereço informado é muito longo.']);

    $this->actingAs($user)
        ->put('/settings/business', ['name' => 'Funilaria Central', 'address' => str_repeat('a', 255)])
        ->assertSessionHasNoErrors();
});
