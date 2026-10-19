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

it('stores the email in lowercase so the user can log in with it', function () {
    $this->artisan('business:create', [
        '--name' => 'Funilaria Central',
        '--owner' => 'João Silva',
        '--email' => 'Joao@Exemplo.com',
        '--password' => 'senha-segura',
    ])->assertSuccessful();

    expect(User::where('email', 'joao@exemplo.com')->exists())->toBeTrue();

    $this->post('/login', ['email' => 'Joao@Exemplo.com', 'password' => 'senha-segura']);

    $this->assertAuthenticated();
});

it('does not create a second business for the same email in another case', function () {
    User::factory()->create(['email' => 'joao@exemplo.com']);

    $this->artisan('business:create', [
        '--name' => 'Outra oficina',
        '--owner' => 'João Silva',
        '--email' => 'JOAO@exemplo.com',
        '--password' => 'senha-segura',
    ])->assertFailed();

    expect(User::count())->toBe(1);
});
