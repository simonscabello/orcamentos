<!DOCTYPE html>
<html lang="pt-BR" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta http-equiv="content-language" content="pt-BR">
        <meta name="description" content="{{ config('brand.description') }}">
        <meta name="theme-color" content="{{ config('brand.theme_color') }}" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="{{ config('brand.theme_color_dark') }}" media="(prefers-color-scheme: dark)">
        <meta name="color-scheme" content="light dark">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ config('brand.short_name') }}">
        <meta name="format-detection" content="telephone=no">
        <meta property="og:locale" content="pt_BR">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <link rel="manifest" href="/manifest.webmanifest">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.985 0.0018 106.42);
            }

            html.dark {
                background-color: oklch(0.183 0.0043 49.25);
            }
        </style>

        <link rel="icon" href="{{ config('brand.icon') }}" type="image/svg+xml">
        <link rel="apple-touch-icon" href="{{ config('brand.icon') }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
