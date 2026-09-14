<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class PublicRegistrationDisabledTest extends TestCase
{
    public function test_registration_routes_are_not_available(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [])->assertNotFound();
    }

    public function test_passkey_routes_are_not_available(): void
    {
        $this->post('/passkeys/login')->assertNotFound();
        $this->get('/user/passkeys/options')->assertNotFound();
        $this->get('/.well-known/passkey-endpoints')->assertNotFound();
    }
}
