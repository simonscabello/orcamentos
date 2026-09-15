# Tratto

MVP mobile-first para oficinas criarem orçamentos profissionais em poucos minutos. É um monólito SaaS Laravel: cada usuário pertence a uma oficina e todos os dados de clientes, veículos e orçamentos são isolados por empresa.

`Tratto` é o nome do produto (provisório). Ele não se confunde com a oficina que usa o sistema: o PDF enviado ao cliente leva apenas os dados do tenant.

## Stack

Laravel 13, PHP 8.5, PostgreSQL, React 19, TypeScript, Inertia 3, Tailwind 4, Vite, Pest e DomPDF.

## Executar localmente

Requisitos: PHP 8.5, Composer, Node 24+, npm e Docker.

```bash
cp .env.example .env
docker compose up -d
composer install
npm install
php artisan key:generate
php artisan migrate --seed
npm run build
composer run dev
```

Abra `http://localhost:8000`.

O seeder cria uma oficina de demonstração com clientes, veículos e orçamentos para navegar pelas telas. Acesso:

```txt
demo@tratto.test
demo123456
```

Ele não roda em produção e não recria os dados se a oficina já tiver orçamentos. Para começar do zero: `php artisan migrate:fresh --seed`. O Compose contém apenas PostgreSQL 17, com banco, usuário e senha `app`, volume persistente e porta local `5434` (a porta interna do container continua `5432`).

## Qualidade

```bash
vendor/bin/pint
npm run check
npm run types:check
npm run build
php artisan test
```

## Criar uma oficina

Com o cadastro público desabilitado, crie oficinas pelo comando abaixo:

```bash
php artisan business:create
```

Também é possível informar os dados sem perguntas interativas:

```bash
php artisan business:create --name="Oficina do André" --owner="André" --email="andre@example.com" --password="uma-senha-segura"
```

## Estrutura

`businesses`, `users`, `customers`, `vehicles`, `estimates` e `estimate_items`. Valores são inteiros em centavos; o total é sempre calculado no servidor. A sequência visível é única por `business_id`.

Rotas autenticadas: `/dashboard`, `/customers`, `/vehicles`, `/estimates`, `/settings/business`. PDFs são gerados sob demanda em `/estimates/{id}/pdf`. O PWA usa manifest e service worker sem cache de páginas autenticadas.

## Marca

O nome do produto vem de `APP_NAME` e é lido por `config('app.name')`; o frontend recebe esse valor (e a tagline) como props compartilhadas do Inertia. Os demais itens de identidade ficam em [config/brand.php](config/brand.php), que alimenta o `<head>` e o manifest da PWA servido em `/manifest.webmanifest`.

Os arquivos de logo estão em `public/brand/`: `mark.svg` (símbolo), `logo.svg` e `logo-inverse.svg` (símbolo + nome) e `icon.svg` (favicon e PWA). Na interface, o símbolo é o componente `resources/js/components/brand-mark.tsx`.

Para trocar a marca: `APP_NAME`, `config/brand.php` e os SVGs de `public/brand/`.

## Deploy

O deploy de produção usa Railway/Railpack, sem Dockerfile ou Compose. Consulte [docs/railway.md](docs/railway.md).
