<?php

use App\Models\User;

it('creates a business and its first user from the command', function () {
    $this->artisan('business:create', [
        '--name' => 'Oficina do André',
        '--owner' => 'André Silva',
        '--email' => 'andre@example.com',
        '--password' => 'senha-segura',
    ])->assertSuccessful();

    $user = User::where('email', 'andre@example.com')->firstOrFail();

    expect($user->business->name)->toBe('Oficina do André')
        ->and($user->name)->toBe('André Silva');
});
