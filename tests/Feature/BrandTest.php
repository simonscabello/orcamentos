<?php

it('serves a pwa manifest with the product brand', function () {
    config(['app.name' => 'Tratto']);

    $this->get('/manifest.webmanifest')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/manifest+json')
        ->assertJsonPath('name', 'Tratto')
        ->assertJsonPath('lang', 'pt-BR')
        ->assertJsonPath('icons.0.src', config('brand.icon'));
});
