<?php

/*
|--------------------------------------------------------------------------
| Identidade do produto
|--------------------------------------------------------------------------
|
| Ponto único da marca do SaaS. O nome vem de APP_NAME (config/app.php) e é
| compartilhado com o frontend pelo HandleInertiaRequests. Os demais valores
| alimentam o <head> e o manifest da PWA, servido em routes/web.php.
|
| A marca aqui é a do produto, nunca a da oficina (tenant): documentos como o
| PDF do orçamento continuam usando apenas os dados da empresa.
|
*/

return [
    'short_name' => env('APP_SHORT_NAME', 'Tratto'),

    'tagline' => 'Orçamentos para oficinas',

    'description' => 'Crie, organize e compartilhe orçamentos da sua oficina em poucos toques, direto do celular.',

    'theme_color' => '#c2410c',

    'theme_color_dark' => '#1c1917',

    'background_color' => '#fafaf9',

    'icon' => '/brand/icon.svg',
];
